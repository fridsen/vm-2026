-- Elapsed match minute from api-football live sync (null when not in play).

alter table public.matches
  add column if not exists live_minute int;

alter table public.knockout_matches
  add column if not exists live_minute int;
