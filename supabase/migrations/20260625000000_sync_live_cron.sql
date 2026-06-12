-- Invoke sync-fixtures?mode=live every 2 minutes. The function skips provider API
-- calls outside kickoff windows (15 min before → 135 min after, incl. ET) and only
-- hits football-data / api-football when a match could be live.
-- Requires the same app.settings as vm2026_sync_fixtures (see 20260601000002_sync_cron.sql).

do $$
declare
  jobid int;
begin
  for jobid in select cron.unschedule(j.jobid) from cron.job j where j.jobname = 'vm2026_sync_live'
  loop
    null;
  end loop;
end$$;

select cron.schedule(
  'vm2026_sync_live',
  '*/2 * * * *',
  $$
    select net.http_post(
      url := current_setting('app.functions_base_url', true) || '/sync-fixtures?mode=live',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
      ),
      body := '{}'::jsonb
    );
  $$
);
