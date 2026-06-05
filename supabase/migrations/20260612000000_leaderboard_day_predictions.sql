-- Leaderboard: allow authenticated users to read others' match predictions
-- for a single calendar day (Swedish tz), used by the player detail overlay.

create or replace function public.fn_user_match_predictions_for_day(
  p_user_id uuid,
  p_day date
)
returns table (
  match_id text,
  home_team_id text,
  away_team_id text,
  kickoff timestamptz,
  prediction jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    m.id as match_id,
    m.home_team_id,
    m.away_team_id,
    m.kickoff,
    p.value as prediction
  from public.matches m
  inner join public.predictions p
    on p.kind = 'match'
   and p.key = m.id
   and p.user_id = p_user_id
  where (m.kickoff at time zone 'Europe/Stockholm')::date = p_day
  order by m.kickoff asc;
$$;

revoke all on function public.fn_user_match_predictions_for_day(uuid, date) from public;
grant execute on function public.fn_user_match_predictions_for_day(uuid, date) to authenticated;
