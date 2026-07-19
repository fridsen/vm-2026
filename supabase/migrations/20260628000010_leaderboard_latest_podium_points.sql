-- Points from the most recently finished podium match only (BRONZE → 5/0,
-- FINAL → gold+silver 15+10). Used for leaderboard rank-movement arrows.

create or replace function public.fn_latest_podium_points_for_leaderboard()
returns table (user_id uuid, points int)
language sql
security definer
set search_path = public
stable
as $$
  with latest_round as (
    select km.round
    from public.knockout_matches km
    where km.status = 'finished'
      and km.round in ('FINAL', 'BRONZE')
      and km.home_score is not null
      and km.away_score is not null
      and km.home_score <> km.away_score
    order by km.kickoff desc
    limit 1
  ),
  actual_full as (
    select public.fn_actual_top_three() as slots
  ),
  actual_partial as (
    select case
      when (select round from latest_round) = 'FINAL' then
        jsonb_build_array(
          (select slots ->> 0 from actual_full),
          (select slots ->> 1 from actual_full),
          null
        )
      when (select round from latest_round) = 'BRONZE' then
        jsonb_build_array(
          null,
          null,
          (select slots ->> 2 from actual_full)
        )
      else jsonb_build_array(null, null, null)
    end as slots
  )
  select
    p.user_id,
    public.fn_score_top_three(
      p.value,
      (select slots from actual_partial)
    )::int as points
  from public.predictions p
  where p.kind = 'final'
    and p.key = 'final'
    and exists (select 1 from latest_round);
$$;

revoke all on function public.fn_latest_podium_points_for_leaderboard() from public;
grant execute on function public.fn_latest_podium_points_for_leaderboard() to anon, authenticated;
