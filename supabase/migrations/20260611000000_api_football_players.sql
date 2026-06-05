-- api-football enrichment (hybrid with football-data match sync).
-- VMkollen-style player profiles and richer squads.

alter table public.teams
  add column if not exists api_football_id text;

create index if not exists teams_api_football_id_idx
  on public.teams (api_football_id)
  where api_football_id is not null;

create table if not exists public.player_profiles (
  api_football_id text primary key,
  details jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.player_profiles;
create trigger set_updated_at
  before update on public.player_profiles
  for each row execute function public.tg_set_updated_at();

alter table public.player_profiles enable row level security;

drop policy if exists "player_profiles read all" on public.player_profiles;
create policy "player_profiles read all" on public.player_profiles
  for select using (true);

comment on table public.player_profiles is
  'Cached api-football player payloads; written by player-profile Edge Function.';
