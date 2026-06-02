-- Shared LLM match-analysis cache.
--
-- The prediction sheet shows an AI-generated Swedish analysis per matchup.
-- Generating it is an OpenAI call, so we cache the result. Previously the
-- cache was per-browser (localStorage), which meant every user re-paid for
-- the same matchup. This table makes the cache GLOBAL: the first user to open
-- a matchup generates and writes the row (write-through), and everyone else
-- reads it for free.
--
-- Key is the matchup (`<home_id>-<away_id>`), mirroring the client's existing
-- localStorage key, so the same two teams in different fixtures (e.g. a group
-- game and a knockout rematch) reuse the same analysis.

create table if not exists public.match_analysis (
  matchup_key  text primary key,        -- `${home_id}-${away_id}`
  analysis     text not null,
  model        text,
  probs_source text,                     -- 'live' | 'mock' the prose was grounded on
  updated_at   timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.match_analysis;
create trigger set_updated_at
  before update on public.match_analysis
  for each row execute function public.tg_set_updated_at();

alter table public.match_analysis enable row level security;

-- Anyone can read the cache (it's not user-specific and not sensitive).
drop policy if exists "match_analysis read all" on public.match_analysis;
create policy "match_analysis read all" on public.match_analysis
  for select using (true);

-- Any signed-in user may populate the cache (write-through). This is fine for
-- a friends' league; tighten to public.is_admin() if you ever want only
-- curated writes. Anonymous visitors can read but never write.
drop policy if exists "match_analysis write authed" on public.match_analysis;
create policy "match_analysis write authed" on public.match_analysis
  for all to authenticated
  using (true) with check (true);
