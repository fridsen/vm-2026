-- Cached RSS headlines for the dashboard news feed.
-- Written by the sync-news Edge Function; read-only from the client.

create table if not exists public.news_articles (
  id            text primary key,
  title         text not null,
  summary       text,
  url           text not null unique,
  source        text not null,
  image_url     text,
  published_at  timestamptz not null,
  synced_at     timestamptz not null default now()
);

create index if not exists news_articles_published_idx
  on public.news_articles (published_at desc);

alter table public.news_articles enable row level security;

drop policy if exists "news_articles read all" on public.news_articles;
create policy "news_articles read all" on public.news_articles
  for select using (true);
