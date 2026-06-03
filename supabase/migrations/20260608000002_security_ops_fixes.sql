-- Fixes: snapshot batch IDs, default order alignment, profile email privacy, lock RPC.

-- ─── 1. Group order matches client teamIdsInGroup (fixture iteration order) ─

create or replace function public.fn_group_team_order(p_group text)
returns text[] language plpgsql stable set search_path = public as $$
declare
  team_order text[] := '{}';
  m record;
begin
  for m in
    select home_team_id, away_team_id
    from public.matches
    where "group" = p_group
    order by kickoff, id
  loop
    if not m.home_team_id = any (team_order) then
      team_order := team_order || m.home_team_id;
    end if;
    if not m.away_team_id = any (team_order) then
      team_order := team_order || m.away_team_id;
    end if;
  end loop;
  return team_order;
end;
$$;

-- ─── 2. Default winner: Swedish collation when available ───────────────────

create or replace function public.fn_default_winner_team_id()
returns text language plpgsql stable set search_path = public as $$
begin
  begin
    return (
      select id from public.teams order by name collate "sv-x-icu" limit 1
    );
  exception
    when undefined_object then
      return (select id from public.teams order by lower(name) limit 1);
  end;
end;
$$;

-- ─── 3. Cron snapshots: one snapshot_id per labeled batch ────────────────────

create or replace function public.fn_cron_deadline_tick()
returns void language plpgsql security definer set search_path = public as $$
declare
  global_deadline timestamptz;
  dry_label text;
  batch_id uuid;
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
      batch_id := gen_random_uuid();
      insert into public.prediction_snapshots (
        snapshot_id, snapshot_at, label, user_id, kind, key, value, source_updated_at
      )
      select
        batch_id,
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
      batch_id := gen_random_uuid();
      insert into public.prediction_snapshots (
        snapshot_id, snapshot_at, label, user_id, kind, key, value, source_updated_at
      )
      select
        batch_id,
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
      batch_id := gen_random_uuid();
      insert into public.prediction_snapshots (
        snapshot_id, snapshot_at, label, user_id, kind, key, value, source_updated_at
      )
      select
        batch_id,
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

-- ─── 4. Profile email: own row + admin only; leaderboard uses definer view ───

drop policy if exists "profiles read all" on public.profiles;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles
  for select using (public.is_admin());

create or replace view public.leaderboard
with (security_invoker = false)
as
with match_scores as (
  select
    p.user_id,
    case
      when sign(coalesce((p.value->>'home')::int,0) - coalesce((p.value->>'away')::int,0))
         = sign(m.home_score - m.away_score)
      then 2 else 0
    end
    + case when (p.value->>'home')::int = m.home_score then 1 else 0 end
    + case when (p.value->>'away')::int = m.away_score then 1 else 0 end
    + case
        when (p.value->>'home')::int = m.home_score
         and (p.value->>'away')::int = m.away_score
        then 1 else 0
      end as points
  from public.predictions p
  join public.matches m on m.id = p.key
  where p.kind = 'match'
    and m.home_score is not null
    and m.away_score is not null
)
select
  pr.id            as user_id,
  pr.display_name  as name,
  coalesce(sum(ms.points), 0)::int as match_points,
  0::int as group_points,
  0::int as knockout_points,
  0::int as top_scorer_points,
  coalesce(sum(ms.points), 0)::int as points,
  coalesce(bool_or(pay.paid), false) as paid
from public.profiles pr
left join match_scores ms on ms.user_id = pr.id
left join public.payments pay on pay.user_id = pr.id
group by pr.id, pr.display_name;

grant select on public.leaderboard to anon, authenticated;

-- ─── 5. Lock hook can read deadline before matches load ────────────────────

grant execute on function public.fn_global_deadline() to authenticated;
