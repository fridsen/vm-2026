-- VM-2026 initial schema.
--
-- Mirrors the shape currently produced by src/data/*.js so that swapping the
-- service layer to Supabase is a body-only change. Every table uses our
-- internal text IDs as primary keys (e.g. 'MEX', 'A-R1-M1', 'R32-1') and
-- carries a nullable `external_id` column that the sync function fills in.
-- That way we can swap providers later without invalidating predictions.

-- ─────────────────────────────────────────────────────────────────────────
-- Reference data (read-only from the client; written by the sync Edge Fn)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.teams (
  id          text primary key,
  name        text not null,
  code        text not null,
  flag        text,
  "group"     text not null,
  external_id text,
  updated_at  timestamptz not null default now()
);

create table if not exists public.matches (
  id            text primary key,
  "group"       text not null,
  round         int  not null,
  kickoff       timestamptz not null,
  home_team_id  text not null references public.teams(id),
  away_team_id  text not null references public.teams(id),
  home_score    int,
  away_score    int,
  status        text not null default 'scheduled',
  external_id   text,
  updated_at    timestamptz not null default now()
);

create index if not exists matches_group_idx on public.matches ("group");
create index if not exists matches_round_idx on public.matches (round);
create index if not exists matches_kickoff_idx on public.matches (kickoff);

create table if not exists public.knockout_matches (
  id            text primary key,
  round         text not null,
  label         text not null,
  kickoff       timestamptz not null,
  home_team_id  text references public.teams(id),
  away_team_id  text references public.teams(id),
  home_source   text,
  away_source   text,
  home_score    int,
  away_score    int,
  status        text not null default 'scheduled',
  external_id   text,
  updated_at    timestamptz not null default now()
);

create index if not exists knockout_round_idx on public.knockout_matches (round);
create index if not exists knockout_kickoff_idx on public.knockout_matches (kickoff);

create table if not exists public.players (
  id          text primary key,
  name        text not null,
  team_code   text,
  position    text,
  external_id text,
  updated_at  timestamptz not null default now()
);

create table if not exists public.topscorers (
  player_id  text primary key references public.players(id),
  goals      int  not null default 0,
  assists    int  not null default 0,
  cards      int  not null default 0,
  position   int,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- User-facing tables (Auth + per-user predictions)
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now()
);

-- Predictions are stored as flat (user_id, kind, key) rows so the table
-- can hold every prediction shape without schema branching. `value` is jsonb
-- so it can carry { home, away, outcome } for matches, [teamId, ...] for
-- group standings, a single teamId for knockout advances, etc.
--
-- Kinds:
--   match              key=match_id            value={home:int, away:int, outcome?:'1'|'X'|'2'}
--   group_standing     key=group letter (A-L)  value=[teamId, teamId, teamId, teamId]
--   top_scorers        key='top_scorers'       value=[playerId, playerId, playerId]
--   knockout_advance   key=knockout_match_id   value=teamId (string)
--   bronze             key='bronze'            value=teamId
--   final              key='final'             value=teamId
--   finalists          key='finalists'         value=[teamId, teamId]
create table if not exists public.predictions (
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,
  key        text not null,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, key)
);

create index if not exists predictions_kind_idx on public.predictions (kind);

-- ─────────────────────────────────────────────────────────────────────────
-- Updated-at triggers
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['teams','matches','knockout_matches','players','topscorers','predictions']
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; '
      'create trigger set_updated_at before update on public.%I '
      'for each row execute function public.tg_set_updated_at();',
      t, t
    );
  end loop;
end$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────

alter table public.teams            enable row level security;
alter table public.matches          enable row level security;
alter table public.knockout_matches enable row level security;
alter table public.players          enable row level security;
alter table public.topscorers       enable row level security;
alter table public.profiles         enable row level security;
alter table public.predictions      enable row level security;

-- Reference tables: anyone (including anon) can read; only service_role writes.
do $$
declare
  t text;
begin
  foreach t in array array['teams','matches','knockout_matches','players','topscorers']
  loop
    execute format('drop policy if exists "%s read all" on public.%I;', t, t);
    execute format('create policy "%s read all" on public.%I for select using (true);', t, t);
  end loop;
end$$;

-- Profiles: anyone authenticated can read (so leaderboard can show names);
-- only the owner can insert/update their own row.
drop policy if exists "profiles read all" on public.profiles;
create policy "profiles read all" on public.profiles
  for select using (true);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

-- Predictions: owner-only read. Insert/update lock policy lives in a later
-- migration so this initial schema works even if the prototype phase wants
-- to write before the server-side lock rules are turned on.
drop policy if exists "predictions read own" on public.predictions;
create policy "predictions read own" on public.predictions
  for select using (auth.uid() = user_id);

drop policy if exists "predictions write own" on public.predictions;
create policy "predictions write own" on public.predictions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Leaderboard view
-- ─────────────────────────────────────────────────────────────────────────
--
-- Computed entirely from finished `matches.home_score`/`away_score` and the
-- predictions table. The scoring rules here mirror src/utils/scoring.js for
-- group matches; richer categories (group standings, knockout, top scorers)
-- are summed in once the corresponding result tables fill in. This is a
-- regular view — cheap enough at our scale (≤100 matches × ~50 users) that
-- a materialized view + refresh isn't worth the complexity.

create or replace view public.leaderboard as
with match_scores as (
  select
    p.user_id,
    -- sign points: 2 if predicted outcome (or score-derived sign) matches
    case
      when sign(coalesce((p.value->>'home')::int,0) - coalesce((p.value->>'away')::int,0))
         = sign(m.home_score - m.away_score)
      then 2 else 0
    end
    -- exact home goals: 1
    + case when (p.value->>'home')::int = m.home_score then 1 else 0 end
    -- exact away goals: 1
    + case when (p.value->>'away')::int = m.away_score then 1 else 0 end
    -- bonus: all of the above
    + case
        when (p.value->>'home')::int = m.home_score
         and (p.value->>'away')::int = m.away_score
        then 1 else 0
      end as points
  from public.predictions p
  join public.matches m on m.id = p.key
  where p.kind = 'match'
    and m.home_score is not null
    and m.away_score is not null
)
select
  pr.id            as user_id,
  pr.display_name  as name,
  coalesce(sum(ms.points), 0)::int as match_points,
  0::int as group_points,
  0::int as knockout_points,
  0::int as top_scorer_points,
  coalesce(sum(ms.points), 0)::int as points
from public.profiles pr
left join match_scores ms on ms.user_id = pr.id
group by pr.id, pr.display_name;

grant select on public.leaderboard to anon, authenticated;
