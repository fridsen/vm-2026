-- Leaderboard player sheet: read another user's match predictions (all matches).

create or replace function public.fn_user_match_predictions(p_user_id uuid)
returns table (
  match_id text,
  prediction jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.key as match_id,
    p.value as prediction
  from public.predictions p
  where p.kind = 'match'
    and p.user_id = p_user_id;
$$;

revoke all on function public.fn_user_match_predictions(uuid) from public;
grant execute on function public.fn_user_match_predictions(uuid) to authenticated;
