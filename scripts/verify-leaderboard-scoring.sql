-- Spot-check SQL scoring helpers against src/utils/scoring.test.js expectations.
-- Run after applying 20260613000000_leaderboard_scoring.sql.
--
--   npm run supabase:verify-scoring
-- or:
--   npx supabase db query --linked -f scripts/verify-leaderboard-scoring.sql

select
  public.fn_score_group_match(
    '{"home":2,"away":1,"outcome":"1"}'::jsonb, 2, 1
  ) = 6 as exact_match_six_points,
  public.fn_score_group_match(
    '{"home":0,"away":1,"outcome":"X"}'::jsonb, 0, 0
  ) = 4 as explicit_sign_four_points,
  public.fn_score_group_standing(
    '["A","B","C","D"]'::jsonb, '["A","B","C","D"]'::jsonb
  ) = 7 as perfect_group_seven_points,
  public.fn_score_top_three(
    '["SWE","BRA","ARG"]'::jsonb, '["SWE","BRA","FRA"]'::jsonb
  ) = 25 as partial_podium_twenty_five_points,
  public.fn_score_top_three(
    '"SWE"'::jsonb, '["SWE","BRA","FRA"]'::jsonb
  ) = 15 as legacy_winner_fifteen_points;
