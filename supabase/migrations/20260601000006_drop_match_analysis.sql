-- Drop the shared LLM match-analysis cache.
--
-- The AI/LLM analysis was replaced by hardcoded, curated text shipped in the
-- client (src/data/matchAnalysis.js), so the cache table added in
-- 20260601000005_match_analysis.sql is no longer used. Dropping it also
-- removes its RLS policies and the updated_at trigger.

drop table if exists public.match_analysis;
