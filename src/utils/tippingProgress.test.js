import { describe, expect, it } from 'vitest';
import { getTippingProgress } from './tippingProgress.js';

describe('getTippingProgress', () => {
  it('returns weighted overall progress across all tipping parts', () => {
    const result = getTippingProgress({
      matchCount: 34,
      totalMatches: 72,
      rankedGroups: 3,
      totalGroups: 12,
      topThreeFilled: 3,
    });

    expect(result.matchesPct).toBe(47);
    expect(result.groupsPct).toBe(25);
    expect(result.topThreePct).toBe(100);
    expect(result.overallPct).toBe(46);
    expect(result.topThreeDone).toBe(true);
  });

  it('returns zero when nothing is tipped', () => {
    const result = getTippingProgress({});

    expect(result.overallPct).toBe(0);
    expect(result.matchesPct).toBe(0);
    expect(result.groupsPct).toBe(0);
    expect(result.topThreePct).toBe(0);
  });
});
