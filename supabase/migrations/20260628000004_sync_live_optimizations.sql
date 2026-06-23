-- Live sync: 1-minute cron + throttle timestamp for api-football today fixtures.

alter table public.sync_health
  add column if not exists last_today_fixtures_at timestamptz;

comment on column public.sync_health.last_today_fixtures_at is
  'Last slow reconcile poll (api-football today/yesterday or outside-window football-data recent). Throttled to every 6 min.';

do $$
declare
  jobid bigint;
begin
  for jobid in select j.jobid from cron.job j where j.jobname = 'vm2026_sync_live'
  loop
    perform cron.unschedule(jobid);
  end loop;
end$$;

select cron.schedule(
  'vm2026_sync_live',
  '* * * * *',
  $$
    select net.http_post(
      url := 'https://kontrqzjmgxgtmgwtvei.supabase.co/functions/v1/sync-fixtures?mode=live',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
