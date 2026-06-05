-- Leaderboard scoring aligned with src/utils/scoring.js and rulesContent.jsx.
-- Active prediction kinds: match, group_standing, final (VM top 3).

-- ─── 1. Match sign helpers ───────────────────────────────────────────────────

create or replace function public.fn_sign_from_score(p_home int, p_away int)
returns text
language sql
immutable
as $$
  select case
    when p_home > p_away then '1'
    when p_home < p_away then '2'
    else 'X'
  end;
$$;

create or replace function public.fn_prediction_sign(p_pred jsonb)
returns text
language sql
immutable
as $$
  select case
    when p_pred->>'outcome' in ('1', 'X', '2') then p_pred->>'outcome'
    when p_pred->>'home' is not null and p_pred->>'away' is not null then
      public.fn_sign_from_score((p_pred->>'home')::int, (p_pred->>'away')::int)
    else null
  end;
$$;

-- Max 6p: 3 sign + 1 home + 1 away + 1 exact bonus
create or replace function public.fn_score_group_match(p_pred jsonb, p_home int, p_away int)
returns int
language sql
immutable
as $$
  select case
    when p_pred is null
      or p_pred->>'home' is null
      or p_pred->>'away' is null
      or p_home is null
      or p_away is null
    then 0
    else
      (case
        when public.fn_prediction_sign(p_pred) = public.fn_sign_from_score(p_home, p_away)
        then 3 else 0
      end)
      + (case when (p_pred->>'home')::int = p_home then 1 else 0 end)
      + (case when (p_pred->>'away')::int = p_away then 1 else 0 end)
      + (case
          when public.fn_prediction_sign(p_pred) = public.fn_sign_from_score(p_home, p_away)
           and (p_pred->>'home')::int = p_home
           and (p_pred->>'away')::int = p_away
          then 1 else 0
        end)
  end;
$$;

-- ─── 2. Group standings (max 7p per group) ─────────────────────────────────

create or replace function public.fn_group_stage_complete(p_group text)
returns boolean
language sql
stable
set search_path = public
as $$
  select count(*) = 6
  from public.matches m
  where m."group" = p_group
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

-- Max 7p: 2 first + 1 second + 1 third + 3 all-four bonus
create or replace function public.fn_score_group_standing(p_pred jsonb, p_actual jsonb)
returns int
language sql
immutable
as $$
  select case
    when p_pred is null
      or p_actual is null
      or jsonb_array_length(p_pred) < 4
      or jsonb_array_length(p_actual) < 4
    then 0
    else
      (case when (p_pred->>0) is not null and p_pred->>0 = p_actual->>0 then 2 else 0 end)
      + (case when (p_pred->>1) is not null and p_pred->>1 = p_actual->>1 then 1 else 0 end)
      + (case when (p_pred->>2) is not null and p_pred->>2 = p_actual->>2 then 1 else 0 end)
      + (case
          when p_pred->>0 = p_actual->>0
           and p_pred->>1 = p_actual->>1
           and p_pred->>2 = p_actual->>2
           and p_pred->>3 = p_actual->>3
          then 3 else 0
        end)
  end;
$$;

-- ─── 3. VM top 3 (max 30p: 15 + 10 + 5) ────────────────────────────────────

create or replace function public.fn_normalize_top_three(p_value jsonb)
returns jsonb
language sql
immutable
as $$
  select case jsonb_typeof(p_value)
    when 'array' then jsonb_build_array(p_value->>0, p_value->>1, p_value->>2)
    when 'string' then jsonb_build_array(p_value #>> '{}', null::text, null::text)
    else jsonb_build_array(null::text, null::text, null::text)
  end;
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
      and km.home_score is not null
      and km.away_score is not null
      and km.home_score <> km.away_score
  )
  and exists (
    select 1
    from public.knockout_matches km
    where km.round = 'BRONZE'
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
  from final_m f
  cross join bronze_m b;
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
      when (pred.slots->>0) is not null and pred.slots->>0 = actual.slots->>0 then 15 else 0
    end)
    + (case
      when (pred.slots->>1) is not null and pred.slots->>1 = actual.slots->>1 then 10 else 0
    end)
    + (case
      when (pred.slots->>2) is not null and pred.slots->>2 = actual.slots->>2 then 5 else 0
    end)
  from pred, actual;
$$;

-- ─── 4. Leaderboard view ───────────────────────────────────────────────────

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
