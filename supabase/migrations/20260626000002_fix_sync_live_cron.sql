-- vm2026_sync_live fails when app.functions_base_url / app.cron_secret are unset
-- (same root cause as sync-news). Hardcode the project URL; sync-fixtures uses
-- verify_jwt = false for cron invocation.

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
  '*/2 * * * *',
  $$
    select net.http_post(
      url := 'https://kontrqzjmgxgtmgwtvei.supabase.co/functions/v1/sync-fixtures?mode=live',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
