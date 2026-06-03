-- Security & ops: scoped locks, audit trail, snapshots, default fills, admin tooling.

-- ─── 1. Scoped prediction lock (match, group_standing, final only) ───────

create or replace function public.fn_prediction_writable(p_kind text, p_key text)
returns boolean language plpgsql stable as $$
declare
  global_deadline timestamptz;
begin
  case p_kind
    when 'match', 'group_standing', 'final' then
      select public.fn_global_deadline() into global_deadline;
      return global_deadline is null or now() < global_deadline;
    else
      return false;
  end case;
end;
$$;

-- ─── 2. Prediction audit trail ───────────────────────────────────────────

create table if not exists public.prediction_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null,
  key         text not null,
  action      text not null check (action in ('insert', 'update', 'delete')),
  source      text not null default 'user' check (source in ('user', 'system_default')),
  old_value   jsonb,
  new_value   jsonb,
  changed_at  timestamptz not null default now()
);

create index if not exists prediction_events_user_changed_idx
  on public.prediction_events (user_id, changed_at desc);

create index if not exists prediction_events_kind_key_idx
  on public.prediction_events (kind, key, changed_at desc);

alter table public.prediction_events enable row level security;

drop policy if exists "prediction_events admin read" on public.prediction_events;
create policy "prediction_events admin read" on public.prediction_events
  for select using (public.is_admin());

create or replace function public.tg_predictions_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ev_source text := coalesce(nullif(current_setting('app.prediction_source', true), ''), 'user');
begin
  if tg_op = 'INSERT' then
    if new.kind not in ('match', 'group_standing', 'final') then
      return new;
    end if;
    insert into public.prediction_events (user_id, kind, key, action, source, old_value, new_value)
    values (new.user_id, new.kind, new.key, 'insert', ev_source, null, new.value);
    return new;
  elsif tg_op = 'UPDATE' then
    if new.kind not in ('match', 'group_standing', 'final') then
      return new;
    end if;
    if old.value is not distinct from new.value then
      return new;
    end if;
    insert into public.prediction_events (user_id, kind, key, action, source, old_value, new_value)
    values (new.user_id, new.kind, new.key, 'update', ev_source, old.value, new.value);
    return new;
  elsif tg_op = 'DELETE' then
    if old.kind not in ('match', 'group_standing', 'final') then
      return old;
    end if;
    insert into public.prediction_events (user_id, kind, key, action, source, old_value, new_value)
    values (old.user_id, old.kind, old.key, 'delete', ev_source, old.value, null);
    return old;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists predictions_audit on public.predictions;
create trigger predictions_audit
  after insert or update or delete on public.predictions
  for each row execute function public.tg_predictions_audit();

-- ─── 3. Prediction snapshots ─────────────────────────────────────────────

create table if not exists public.prediction_snapshots (
  snapshot_id         uuid not null,
  snapshot_at         timestamptz not null default now(),
  label               text not null,
  user_id             uuid not null references auth.users(id) on delete cascade,
  kind                text not null,
  key                 text not null,
  value               jsonb not null,
  source_updated_at   timestamptz,
  primary key (snapshot_id, user_id, kind, key)
);

create index if not exists prediction_snapshots_label_idx
  on public.prediction_snapshots (label, snapshot_at desc);

alter table public.prediction_snapshots enable row level security;

drop policy if exists "prediction_snapshots admin read" on public.prediction_snapshots;
create policy "prediction_snapshots admin read" on public.prediction_snapshots
  for select using (public.is_admin());

create or replace function public.fn_snapshot_all_predictions(p_label text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_snapshot_id uuid := gen_random_uuid();
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  if p_label is null or length(trim(p_label)) = 0 then
    raise exception 'snapshot label required';
  end if;

  insert into public.prediction_snapshots (
    snapshot_id, snapshot_at, label, user_id, kind, key, value, source_updated_at
  )
  select
    v_snapshot_id,
    now(),
    p_label,
    p.user_id,
    p.kind,
    p.key,
    p.value,
    p.updated_at
  from public.predictions p
  where p.kind in ('match', 'group_standing', 'final');

  get diagnostics v_count = row_count;

  return jsonb_build_object(
    'snapshot_id', v_snapshot_id,
    'label', p_label,
    'rows', v_count
  );
end;
$$;

grant execute on function public.fn_snapshot_all_predictions(text) to authenticated;

-- ─── 4. Default predictions after deadline ───────────────────────────────

create or replace function public.fn_group_team_order(p_group text)
returns text[] language sql stable as $$
  with group_fixtures as (
    select home_team_id as team_id, kickoff, id from public.matches where "group" = p_group
    union all
    select away_team_id, kickoff, id from public.matches where "group" = p_group
  ),
  first_seen as (
    select team_id, min(kickoff) as first_kickoff, min(id) as first_match_id
    from group_fixtures
    group by team_id
  )
  select array_agg(team_id order by first_kickoff, first_match_id, team_id)
  from first_seen;
$$;

create or replace function public.fn_default_winner_team_id()
returns text language sql stable as $$
  select id from public.teams order by lower(name) limit 1;
$$;

create or replace function public.fn_apply_default_predictions()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  global_deadline timestamptz;
  v_matches int := 0;
  v_groups int := 0;
  v_finals int := 0;
  g text;
  team_order text[];
  winner_id text;
  n int;
begin
  select public.fn_global_deadline() into global_deadline;
  if global_deadline is null or now() < global_deadline then
    return jsonb_build_object('ok', false, 'reason', 'before_deadline');
  end if;

  perform set_config('app.prediction_source', 'system_default', true);

  select public.fn_default_winner_team_id() into winner_id;

  insert into public.predictions (user_id, kind, key, value)
  select pr.id, 'match', m.id, jsonb_build_object('home', 0, 'away', 0, 'outcome', 'X')
  from public.profiles pr
  cross join public.matches m
  where not exists (
    select 1 from public.predictions p
    where p.user_id = pr.id and p.kind = 'match' and p.key = m.id
  )
  on conflict (user_id, kind, key) do nothing;
  get diagnostics v_matches = row_count;

  foreach g in array array['A','B','C','D','E','F','G','H','I','J','K','L'] loop
    select public.fn_group_team_order(g) into team_order;
    if team_order is null or array_length(team_order, 1) is null then
      continue;
    end if;
    insert into public.predictions (user_id, kind, key, value)
    select pr.id, 'group_standing', g, to_jsonb(team_order)
    from public.profiles pr
    where not exists (
      select 1 from public.predictions p
      where p.user_id = pr.id and p.kind = 'group_standing' and p.key = g
    )
    on conflict (user_id, kind, key) do nothing;
    get diagnostics n = row_count;
    v_groups := v_groups + n;
  end loop;

  if winner_id is not null then
    insert into public.predictions (user_id, kind, key, value)
    select pr.id, 'final', 'final', to_jsonb(winner_id)
    from public.profiles pr
    where not exists (
      select 1 from public.predictions p
      where p.user_id = pr.id and p.kind = 'final' and p.key = 'final'
    )
    on conflict (user_id, kind, key) do nothing;
    get diagnostics v_finals = row_count;
  end if;

  perform set_config('app.prediction_source', 'user', true);

  return jsonb_build_object(
    'ok', true,
    'matches', v_matches,
    'groups', v_groups,
    'finals', v_finals
  );
end;
$$;

-- Cron-friendly tick: dry-run snapshot T-3, final snapshot + defaults after kickoff.
create or replace function public.fn_cron_deadline_tick()
returns void language plpgsql security definer set search_path = public as $$
declare
  global_deadline timestamptz;
  dry_label text;
begin
  select public.fn_global_deadline() into global_deadline;
  if global_deadline is null then
    return;
  end if;

  if now() >= global_deadline - interval '3 days' and now() < global_deadline then
    dry_label := 'dry_run_' || to_char(now() at time zone 'UTC', 'YYYY-MM-DD');
    if not exists (
      select 1 from public.prediction_snapshots where label = dry_label limit 1
    ) then
      insert into public.prediction_snapshots (
        snapshot_id, snapshot_at, label, user_id, kind, key, value, source_updated_at
      )
      select
        gen_random_uuid(),
        now(),
        dry_label,
        p.user_id,
        p.kind,
        p.key,
        p.value,
        p.updated_at
      from public.predictions p
      where p.kind in ('match', 'group_standing', 'final');
    end if;
  end if;

  if now() >= global_deadline then
    if not exists (
      select 1 from public.prediction_snapshots where label = 'pre_kickoff_final' limit 1
    ) then
      insert into public.prediction_snapshots (
        snapshot_id, snapshot_at, label, user_id, kind, key, value, source_updated_at
      )
      select
        gen_random_uuid(),
        now(),
        'pre_kickoff_final',
        p.user_id,
        p.kind,
        p.key,
        p.value,
        p.updated_at
      from public.predictions p
      where p.kind in ('match', 'group_standing', 'final');
    end if;
    perform public.fn_apply_default_predictions();
    if not exists (
      select 1 from public.prediction_snapshots where label = 'post_defaults' limit 1
    ) then
      insert into public.prediction_snapshots (
        snapshot_id, snapshot_at, label, user_id, kind, key, value, source_updated_at
      )
      select
        gen_random_uuid(),
        now(),
        'post_defaults',
        p.user_id,
        p.kind,
        p.key,
        p.value,
        p.updated_at
      from public.predictions p
      where p.kind in ('match', 'group_standing', 'final');
    end if;
  end if;
end;
$$;

do $$
declare
  jobid int;
begin
  for jobid in select cron.unschedule(j.jobid) from cron.job j where j.jobname = 'vm2026_deadline_tick'
  loop
    null;
  end loop;
end$$;

select cron.schedule(
  'vm2026_deadline_tick',
  '*/15 * * * *',
  $$ select public.fn_cron_deadline_tick(); $$
);

-- ─── 5. Profiles email + payment reminders ───────────────────────────────

alter table public.profiles
  add column if not exists email text;

do $$
declare
  r record;
begin
  for r in
    select u.id, u.email
    from auth.users u
    where u.email is not null
  loop
    update public.profiles
    set email = r.email
    where id = r.id and (email is null or email = '');
  end loop;
end$$;

alter table public.payments
  add column if not exists reminder_count int not null default 0,
  add column if not exists last_reminder_at timestamptz;

create table if not exists public.payment_reminders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  message       text not null,
  created_at    timestamptz not null default now(),
  read_at       timestamptz,
  sent_by       uuid references auth.users(id) on delete set null,
  email_sent_at timestamptz
);

create index if not exists payment_reminders_user_unread_idx
  on public.payment_reminders (user_id, created_at desc)
  where read_at is null;

alter table public.payment_reminders enable row level security;

drop policy if exists "payment_reminders read own" on public.payment_reminders;
create policy "payment_reminders read own" on public.payment_reminders
  for select using (auth.uid() = user_id);

drop policy if exists "payment_reminders update own read" on public.payment_reminders;
create policy "payment_reminders update own read" on public.payment_reminders
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── 6. Admin RPCs ───────────────────────────────────────────────────────

create or replace function public.admin_list_payment_status(p_unpaid_only boolean default true)
returns table (
  user_id uuid,
  email text,
  display_name text,
  payment_ack boolean,
  paid boolean,
  last_reminder_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    pr.id,
    coalesce(pr.email, '')::text,
    pr.display_name,
    coalesce(pr.payment_ack, false),
    coalesce(py.paid, false),
    py.last_reminder_at
  from public.profiles pr
  left join public.payments py on py.user_id = pr.id
  where not p_unpaid_only or coalesce(py.paid, false) = false
  order by pr.display_name;
end;
$$;

grant execute on function public.admin_list_payment_status(boolean) to authenticated;

create or replace function public.admin_list_prediction_events(
  p_user_id uuid default null,
  p_limit int default 200
)
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  kind text,
  key text,
  action text,
  source text,
  old_value jsonb,
  new_value jsonb,
  changed_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select
    e.id,
    e.user_id,
    pr.display_name,
    e.kind,
    e.key,
    e.action,
    e.source,
    e.old_value,
    e.new_value,
    e.changed_at
  from public.prediction_events e
  join public.profiles pr on pr.id = e.user_id
  where p_user_id is null or e.user_id = p_user_id
  order by e.changed_at desc
  limit greatest(1, least(p_limit, 500));
end;
$$;

grant execute on function public.admin_list_prediction_events(uuid, int) to authenticated;

create or replace function public.admin_run_deadline_jobs()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  snap_pre jsonb;
  snap_post jsonb;
  defaults jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  snap_pre := public.fn_snapshot_all_predictions('manual_pre_defaults');
  defaults := public.fn_apply_default_predictions();
  snap_post := public.fn_snapshot_all_predictions('manual_post_defaults');

  return jsonb_build_object(
    'ok', true,
    'pre_defaults', snap_pre,
    'defaults', defaults,
    'post_defaults', snap_post
  );
end;
$$;

grant execute on function public.admin_run_deadline_jobs() to authenticated;
