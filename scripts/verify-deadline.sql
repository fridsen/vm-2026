-- WC readiness: deadline + match schedule sanity check.
-- Run: npm run supabase:verify-deadline

select public.fn_global_deadline() as deadline;

select count(*) as match_count from public.matches;

select min(kickoff) as first_kickoff, max(kickoff) as last_kickoff from public.matches;
