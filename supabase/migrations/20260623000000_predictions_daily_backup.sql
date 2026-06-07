-- Daily in-database backup of all active predictions → prediction_snapshots.
-- Complements manual JSON export via `npm run supabase:backup-predictions`.

create or replace function public.fn_backup_all_predictions(p_label text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot_id uuid := gen_random_uuid();
  v_count int;
begin
  if p_label is null or length(trim(p_label)) = 0 then
    raise exception 'snapshot label required';
  end if;

  insert into public.prediction_snapshots (
    snapshot_id, snapshot_at, label, user_id, kind, key, value, source_updated_at
  )
  select
    v_snapshot_id,
    now(),
    p_label,
    p.user_id,
    p.kind,
    p.key,
    p.value,
    p.updated_at
  from public.predictions p
  where p.kind in ('match', 'group_standing', 'final');

  get diagnostics v_count = row_count;

  return jsonb_build_object(
    'snapshot_id', v_snapshot_id,
    'label', p_label,
    'rows', v_count,
    'snapshot_at', now()
  );
end;
$$;

revoke all on function public.fn_backup_all_predictions(text) from public;
grant execute on function public.fn_backup_all_predictions(text) to service_role;

create or replace function public.fn_cron_daily_predictions_backup()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  backup_label text;
begin
  backup_label := 'daily_backup_' || to_char(now() at time zone 'Europe/Stockholm', 'YYYY-MM-DD');
  if exists (
    select 1 from public.prediction_snapshots where label = backup_label limit 1
  ) then
    return;
  end if;

  perform public.fn_backup_all_predictions(backup_label);
end;
$$;

do $$
declare
  jobid int;
begin
  for jobid in
    select cron.unschedule(j.jobid)
    from cron.job j
    where j.jobname = 'vm2026_daily_predictions_backup'
  loop
    null;
  end loop;
end$$;

-- 02:00 UTC ≈ 04:00 Stockholm (sommartid) / 03:00 (vintertid)
select cron.schedule(
  'vm2026_daily_predictions_backup',
  '0 2 * * *',
  $$ select public.fn_cron_daily_predictions_backup(); $$
);
