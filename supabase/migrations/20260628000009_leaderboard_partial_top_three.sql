-- Partial podium scoring: award bronze (5) when BRONZE is finished,
-- gold/silver (15/10) when FINAL is finished. Leaderboard totals include
-- decided slots immediately (no wait for full podium).

create or replace function public.fn_actual_top_three()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_array(
    (
      select case
        when km.home_score > km.away_score then km.home_team_id
        else km.away_team_id
      end
      from public.knockout_matches km
      where km.round = 'FINAL'
        and km.status = 'finished'
        and km.home_score is not null
        and km.away_score is not null
        and km.home_score <> km.away_score
      order by km.kickoff
      limit 1
    ),
    (
      select case
        when km.home_score > km.away_score then km.away_team_id
        else km.home_team_id
      end
      from public.knockout_matches km
      where km.round = 'FINAL'
        and km.status = 'finished'
        and km.home_score is not null
        and km.away_score is not null
        and km.home_score <> km.away_score
      order by km.kickoff
      limit 1
    ),
    (
      select case
        when km.home_score > km.away_score then km.home_team_id
        else km.away_team_id
      end
      from public.knockout_matches km
      where km.round = 'BRONZE'
        and km.status = 'finished'
        and km.home_score is not null
        and km.away_score is not null
        and km.home_score <> km.away_score
      order by km.kickoff
      limit 1
    )
  );
$$;

create or replace function public.fn_score_top_three(p_pred jsonb, p_actual jsonb)
returns int
language sql
immutable
as $$
  with pred as (
    select public.fn_normalize_top_three(p_pred) as slots
  ),
  actual as (
    select public.fn_normalize_top_three(p_actual) as slots
  )
  select
    (case
      when (pred.slots->>0) is not null
        and (actual.slots->>0) is not null
        and pred.slots->>0 = actual.slots->>0 then 15
      else 0
    end)
    + (case
      when (pred.slots->>1) is not null
        and (actual.slots->>1) is not null
        and pred.slots->>1 = actual.slots->>1 then 10
      else 0
    end)
    + (case
      when (pred.slots->>2) is not null
        and (actual.slots->>2) is not null
        and pred.slots->>2 = actual.slots->>2 then 5
      else 0
    end)
  from pred, actual;
$$;

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
    public.fn_score_top_three(p.value, public.fn_actual_top_three())::int as points
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
