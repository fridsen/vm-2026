-- Persist sync run results for admin monitoring + fix full sync cron URL.

create table if not exists public.sync_health (
  mode text primary key check (mode in ('live', 'full')),
  last_run_at timestamptz not null default now(),
  last_ok_at timestamptz,
  ok boolean not null default true,
  live_updated int not null default 0,
  skipped boolean not null default false,
  skip_reason text,
  duration_ms int,
  provider text,
  error text,
  updated_at timestamptz not null default now()
);

comment on table public.sync_health is
  'Last run metadata for sync-fixtures (live + full). Written by the edge function.';

alter table public.sync_health enable row level security;

drop policy if exists "sync_health admin read" on public.sync_health;
create policy "sync_health admin read" on public.sync_health
  for select using (public.is_admin());

-- Full sync cron: same hardcoded URL fix as live/news (app.settings often unset).
do $$
declare
  jobid bigint;
begin
  for jobid in select j.jobid from cron.job j where j.jobname = 'vm2026_sync_fixtures'
  loop
    perform cron.unschedule(jobid);
  end loop;
end$$;

select cron.schedule(
  'vm2026_sync_fixtures',
  '*/10 * * * *',
  $$
    select net.http_post(
      url := 'https://kontrqzjmgxgtmgwtvei.supabase.co/functions/v1/sync-fixtures',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
