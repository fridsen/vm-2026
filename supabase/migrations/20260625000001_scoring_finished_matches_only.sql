-- Only score matches once football-data.org marks them finished.
-- Live sync writes in_play scores for display; they must not affect points yet.

create or replace function public.fn_group_stage_complete(p_group text)
returns boolean
language sql
stable
set search_path = public
as $$
  select count(*) = 6
  from public.matches m
  where m."group" = p_group
    and m.status = 'finished'
    and m.home_score is not null
    and m.away_score is not null;
$$;

create or replace function public.fn_computed_group_standing(p_group text)
returns jsonb
language sql
stable
set search_path = public
as $$
  with stats as (
    select
      t.id as team_id,
      t.name,
      coalesce(sum(case
        when m.id is not null then 1 else 0
      end), 0)::int as played,
      coalesce(sum(case
        when m.home_team_id = t.id and m.home_score > m.away_score then 3
        when m.away_team_id = t.id and m.away_score > m.home_score then 3
        when m.home_score = m.away_score
         and (m.home_team_id = t.id or m.away_team_id = t.id) then 1
        else 0
      end), 0)::int as pts,
      coalesce(sum(case
        when m.home_team_id = t.id then m.home_score
        when m.away_team_id = t.id then m.away_score
        else 0
      end), 0)::int as gf,
      coalesce(sum(case
        when m.home_team_id = t.id then m.away_score
        when m.away_team_id = t.id then m.home_score
        else 0
      end), 0)::int as ga
    from public.teams t
    left join public.matches m
      on m."group" = p_group
     and m.status = 'finished'
     and m.home_score is not null
     and m.away_score is not null
     and (m.home_team_id = t.id or m.away_team_id = t.id)
    where t."group" = p_group
    group by t.id, t.name
  ),
  ranked as (
    select
      team_id,
      row_number() over (
        order by pts desc, (gf - ga) desc, gf desc, lower(name)
      ) as rn
    from stats
  )
  select coalesce(
    jsonb_agg(team_id order by rn),
    '[]'::jsonb
  )
  from ranked
  where rn <= 4;
$$;

create or replace function public.fn_tournament_podium_complete()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.knockout_matches km
    where km.round = 'FINAL'
      and km.status = 'finished'
      and km.home_score is not null
      and km.away_score is not null
      and km.home_score <> km.away_score
  )
  and exists (
    select 1
    from public.knockout_matches km
    where km.round = 'BRONZE'
      and km.status = 'finished'
      and km.home_score is not null
      and km.away_score is not null
      and km.home_score <> km.away_score
  );
$$;

create or replace function public.fn_actual_top_three()
returns jsonb
language sql
stable
set search_path = public
as $$
  with final_m as (
    select km.home_team_id, km.away_team_id, km.home_score, km.away_score
    from public.knockout_matches km
    where km.round = 'FINAL'
      and km.status = 'finished'
      and km.home_score is not null
      and km.away_score is not null
      and km.home_score <> km.away_score
    order by km.kickoff
    limit 1
  ),
  bronze_m as (
    select km.home_team_id, km.away_team_id, km.home_score, km.away_score
    from public.knockout_matches km
    where km.round = 'BRONZE'
      and km.status = 'finished'
      and km.home_score is not null
      and km.away_score is not null
      and km.home_score <> km.away_score
    order by km.kickoff
    limit 1
  )
  select jsonb_build_array(
    case when f.home_score > f.away_score then f.home_team_id else f.away_team_id end,
    case when f.home_score > f.away_score then f.away_team_id else f.home_team_id end,
    case when b.home_score > b.away_score then b.home_team_id else b.away_team_id end
  )
  from final_m f, bronze_m b;
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
