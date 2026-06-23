-- Leaderboard tab: points earned on a specific finished match (all players).

create or replace function public.fn_match_points_for_leaderboard(p_match_id text)
returns table (user_id uuid, points int)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.user_id,
    public.fn_score_group_match(p.value, m.home_score, m.away_score)::int as points
  from public.predictions p
  join public.matches m on m.id = p_match_id
  where p.kind = 'match'
    and p.key = p_match_id
    and m.status = 'finished'
    and m.home_score is not null
    and m.away_score is not null;
$$;

revoke all on function public.fn_match_points_for_leaderboard(text) from public;
grant execute on function public.fn_match_points_for_leaderboard(text) to authenticated;
