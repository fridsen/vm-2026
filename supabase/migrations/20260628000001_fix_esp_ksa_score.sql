-- football-data.org reported 5-0 for H-R2-M1 (Spain vs Saudi Arabia, 21 Jun 2026).
-- Verified FT is 4-0 (Yamal, Oyarzabal x2, Tambakti OG).

update public.matches
set home_score = 4,
    away_score = 0,
    updated_at = now()
where id = 'H-R2-M1'
  and home_team_id = 'ESP'
  and away_team_id = 'KSA'
  and home_score = 5
  and away_score = 0;
