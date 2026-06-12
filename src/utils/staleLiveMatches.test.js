import { describe, expect, it } from 'vitest';
import {
  hasStaleLiveMatches,
  isStaleLiveMatch,
  STALE_LIVE_GRACE_MS,
} from './staleLiveMatches.js';

const kickoff = '2026-06-12T19:00:00.000Z';

describe('staleLiveMatches', () => {
  it('is not stale before grace period', () => {
    const at5min = new Date(kickoff).getTime() + 5 * 60_000;
    expect(
      isStaleLiveMatch({ kickoff, status: 'scheduled', result: null, liveScore: null }, at5min),
    ).toBe(false);
  });

  it('is stale after grace without scores', () => {
    const at15min = new Date(kickoff).getTime() + STALE_LIVE_GRACE_MS + 60_000;
    expect(
      isStaleLiveMatch({ kickoff, status: 'scheduled', result: null, liveScore: null }, at15min),
    ).toBe(true);
  });

  it('is not stale when liveScore exists', () => {
    const at20min = new Date(kickoff).getTime() + 20 * 60_000;
    expect(
      isStaleLiveMatch(
        { kickoff, status: 'in_play', liveScore: { home: 0, away: 1 }, result: null },
        at20min,
      ),
    ).toBe(false);
  });

  it('detects stale across group and knockout lists', () => {
    const now = new Date(kickoff).getTime() + STALE_LIVE_GRACE_MS + 60_000;
    expect(
      hasStaleLiveMatches(
        [],
        [{ id: 'k1', kickoff, status: 'scheduled', result: null, liveScore: null }],
        now,
      ),
    ).toBe(true);
  });
});
