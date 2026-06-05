-- VM final: single team id → ordered top-3 array [gold, silver, bronze]

update public.predictions
set value = jsonb_build_array(value, null::jsonb, null::jsonb)
where kind = 'final'
  and key = 'final'
  and jsonb_typeof(value) = 'string';

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
    select pr.id, 'final', 'final', jsonb_build_array(winner_id, null::jsonb, null::jsonb)
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
