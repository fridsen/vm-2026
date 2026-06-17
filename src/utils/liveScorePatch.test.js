import { describe, expect, it } from 'vitest';
import { buildLiveScorePatch } from '../../supabase/functions/_shared/liveScorePatch.ts';

describe('buildLiveScorePatch', () => {
  it('does not downgrade in_play totals from a lagging feed', () => {
    expect(
      buildLiveScorePatch(
        { home_score: 1, away_score: 3, status: 'in_play' },
        { homeScore: 1, awayScore: 2, status: 'in_play' },
      ),
    ).toBeNull();
  });

  it('updates in_play when the feed advances', () => {
    expect(
      buildLiveScorePatch(
        { home_score: 1, away_score: 2, status: 'in_play' },
        { homeScore: 1, awayScore: 3, status: 'in_play' },
      ),
    ).toEqual({ home_score: 1, away_score: 3 });
  });

  it('corrects a finished match when the provider sends a different final score', () => {
    expect(
      buildLiveScorePatch(
        { home_score: 1, away_score: 3, status: 'finished' },
        { homeScore: 1, awayScore: 4, status: 'finished' },
      ),
    ).toEqual({ home_score: 1, away_score: 4 });
  });

  it('leaves an already-correct finished match unchanged', () => {
    expect(
      buildLiveScorePatch(
        { home_score: 1, away_score: 4, status: 'finished' },
        { homeScore: 1, awayScore: 4, status: 'finished' },
      ),
    ).toBeNull();
  });
});
