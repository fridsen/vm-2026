-- Smoke-test prediction locks (run in Supabase SQL editor as a normal user session
-- is not possible here — use Dashboard with service role to inspect, or psql).
--
-- Expected after migration 20260608000001_security_ops.sql:
-- 1. fn_prediction_writable('knockout_advance', any) = false (always)
-- 2. fn_prediction_writable('match', id) = true before first kickoff, false after
-- 3. Same for group_standing and final

select public.fn_prediction_writable('knockout_advance', 'test') as knockout_blocked;

select public.fn_global_deadline() as global_deadline;

select
  public.fn_prediction_writable('match', (select id from public.matches limit 1)) as match_writable,
  public.fn_prediction_writable('group_standing', 'A') as group_writable,
  public.fn_prediction_writable('final', 'final') as final_writable;

-- After saving a tip twice, expect two prediction_events rows:
-- select * from public.prediction_events order by changed_at desc limit 5;
