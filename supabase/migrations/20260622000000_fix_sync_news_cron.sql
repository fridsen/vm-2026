-- vm2026_sync_news failed every run because app.functions_base_url and
-- app.cron_secret were never set in Database Settings (current_setting → null).
-- Use the project functions URL directly; sync-news is deployed with verify_jwt = false.

do $$
declare
  jobid bigint;
begin
  for jobid in select j.jobid from cron.job j where j.jobname = 'vm2026_sync_news'
  loop
    perform cron.unschedule(jobid);
  end loop;
end$$;

select cron.schedule(
  'vm2026_sync_news',
  '*/30 * * * *',
  $$
    select net.http_post(
      url := 'https://kontrqzjmgxgtmgwtvei.supabase.co/functions/v1/sync-news',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
