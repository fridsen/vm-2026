import { describe, expect, it } from 'vitest';
import { latestPointsDisplayForUser } from './latestMatchPointsDisplay.js';

describe('latestPointsDisplayForUser', () => {
  const totals = { a: 6, b: 3 };
  const breakdown = { a: [4, 2], b: [1, 2] };

  it('returns breakdown per user when available', () => {
    expect(latestPointsDisplayForUser('a', totals, breakdown, 2)).toEqual([4, 2]);
  });

  it('returns zeroes for missing users in a multi-match slot', () => {
    expect(latestPointsDisplayForUser('c', totals, breakdown, 2)).toEqual([0, 0]);
  });

  it('returns a single value for one-match slots', () => {
    expect(latestPointsDisplayForUser('b', totals, null, 1)).toEqual([3]);
  });
});
