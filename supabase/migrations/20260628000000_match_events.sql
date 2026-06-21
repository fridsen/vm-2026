-- Match event timeline for result reveal (goals, cards, injuries).
-- Populated by sync-fixtures from api-football fixture events.

create table if not exists public.match_events (
  id          uuid primary key default gen_random_uuid(),
  match_id    text not null references public.matches(id) on delete cascade,
  minute      int  not null,
  type        text not null check (type in ('goal', 'yellow', 'red', 'injury')),
  team_side   text not null check (team_side in ('home', 'away')),
  player_name text,
  detail      text not null,
  sort_order  int  not null,
  updated_at  timestamptz not null default now()
);

create index if not exists match_events_match_sort_idx
  on public.match_events (match_id, sort_order);

alter table public.match_events enable row level security;

drop policy if exists "match_events read all" on public.match_events;
create policy "match_events read all" on public.match_events
  for select using (true);

drop trigger if exists set_updated_at on public.match_events;
create trigger set_updated_at before update on public.match_events
  for each row execute function public.tg_set_updated_at();
