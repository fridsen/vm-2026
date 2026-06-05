-- Cached rich team payload from sync-fixtures (squad, coach, venue, etc.).
-- Written only by the service role; clients read via existing teams RLS.

alter table public.teams
  add column if not exists details jsonb;

comment on column public.teams.details is
  'Provider-normalized team profile (squad, coach, venue). Synced by sync-fixtures.';
