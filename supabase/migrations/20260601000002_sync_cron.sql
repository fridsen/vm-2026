-- Schedule the sync-fixtures Edge Function via pg_cron + pg_net.
--
-- The function URL and a service-role key are read from app.settings so the
-- migration can be checked into git without leaking secrets. Set them in the
-- Supabase Dashboard once (Database → Database Settings → Custom config):
--   app.functions_base_url = 'https://<project>.supabase.co/functions/v1'
--   app.cron_secret        = <a long random string>
--
-- The Edge Function checks the `Authorization: Bearer …` header against
-- SUPABASE_SERVICE_ROLE_KEY (handled automatically by Supabase's gateway when
-- you use the anon or service role key here).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotently (un)schedule so re-running the migration doesn't pile up jobs.
do $$
declare
  jobid int;
begin
  for jobid in select cron.unschedule(j.jobid) from cron.job j where j.jobname = 'vm2026_sync_fixtures'
  loop
    -- nothing else to do; loop just consumes the SETOF
    null;
  end loop;
end$$;

-- Every 10 minutes. Cheap enough for free-tier providers and well within
-- Supabase's free-tier Edge Function quota.
select cron.schedule(
  'vm2026_sync_fixtures',
  '*/10 * * * *',
  $$
    select net.http_post(
      url := current_setting('app.functions_base_url', true) || '/sync-fixtures',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
      ),
      body := '{}'::jsonb
    );
  $$
);
