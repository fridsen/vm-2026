-- Leaderboard player sheet: read another user's group-standing predictions.

create or replace function public.fn_user_group_standings(p_user_id uuid)
returns table (
  group_key text,
  prediction jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.key as group_key,
    p.value as prediction
  from public.predictions p
  where p.kind = 'group_standing'
    and p.user_id = p_user_id;
$$;

revoke all on function public.fn_user_group_standings(uuid) from public;
grant execute on function public.fn_user_group_standings(uuid) to authenticated;
