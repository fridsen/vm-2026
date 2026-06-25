-- Restore group-standing points on the leaderboard (match + group + knockout total).

create or replace view public.leaderboard
with (security_invoker = false)
as
with match_by_user as (
  select
    p.user_id,
    sum(public.fn_score_group_match(p.value, m.home_score, m.away_score))::int as points
  from public.predictions p
  join public.matches m on m.id = p.key
  where p.kind = 'match'
    and m.status = 'finished'
    and m.home_score is not null
    and m.away_score is not null
  group by p.user_id
),
group_by_user as (
  select
    p.user_id,
    sum(
      case
        when public.fn_group_stage_complete(p.key) then
          public.fn_score_group_standing(
            p.value,
            public.fn_computed_group_standing(p.key)
          )
        else 0
      end
    )::int as points
  from public.predictions p
  where p.kind = 'group_standing'
  group by p.user_id
),
knockout_by_user as (
  select
    p.user_id,
    case
      when public.fn_tournament_podium_complete() then
        public.fn_score_top_three(p.value, public.fn_actual_top_three())
      else 0
    end::int as points
  from public.predictions p
  where p.kind = 'final'
    and p.key = 'final'
)
select
  pr.id            as user_id,
  pr.display_name  as name,
  coalesce(mb.points, 0) as match_points,
  coalesce(gb.points, 0) as group_points,
  coalesce(kb.points, 0) as knockout_points,
  0::int as top_scorer_points,
  (
    coalesce(mb.points, 0)
    + coalesce(gb.points, 0)
    + coalesce(kb.points, 0)
  )::int as points,
  coalesce(bool_or(pay.paid), false) as paid
from public.profiles pr
left join match_by_user mb on mb.user_id = pr.id
left join group_by_user gb on gb.user_id = pr.id
left join knockout_by_user kb on kb.user_id = pr.id
left join public.payments pay on pay.user_id = pr.id
group by pr.id, pr.display_name, mb.points, gb.points, kb.points;

grant select on public.leaderboard to anon, authenticated;

create or replace function public.fn_group_points_for_leaderboard(p_group text)
returns table (user_id uuid, points int)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.user_id,
    public.fn_score_group_standing(
      p.value,
      public.fn_computed_group_standing(p.key)
    )::int as points
  from public.predictions p
  where p.kind = 'group_standing'
    and p.key = p_group
    and public.fn_group_stage_complete(p.key);
$$;

revoke all on function public.fn_group_points_for_leaderboard(text) from public;
grant execute on function public.fn_group_points_for_leaderboard(text) to anon, authenticated;
