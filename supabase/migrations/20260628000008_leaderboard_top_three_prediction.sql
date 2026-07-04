-- Leaderboard player sheet: read another user's VM top-3 prediction.

create or replace function public.fn_user_top_three(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select p.value
  from public.predictions p
  where p.kind = 'final'
    and p.key = 'final'
    and p.user_id = p_user_id
  limit 1;
$$;

revoke all on function public.fn_user_top_three(uuid) from public;
grant execute on function public.fn_user_top_three(uuid) to authenticated;
