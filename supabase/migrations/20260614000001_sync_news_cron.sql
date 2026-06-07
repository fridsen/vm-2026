-- Schedule the sync-news Edge Function via pg_cron + pg_net.
-- Uses the same app.settings secrets as sync-fixtures.

do $$
declare
  jobid int;
begin
  for jobid in select cron.unschedule(j.jobid) from cron.job j where j.jobname = 'vm2026_sync_news'
  loop
    null;
  end loop;
end$$;

-- Every 30 minutes — news does not need the 10-minute cadence of live scores.
select cron.schedule(
  'vm2026_sync_news',
  '*/30 * * * *',
  $$
    select net.http_post(
      url := current_setting('app.functions_base_url', true) || '/sync-news',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
      ),
      body := '{}'::jsonb
    );
  $$
);
