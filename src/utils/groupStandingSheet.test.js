import { describe, expect, it } from 'vitest';
import {
  groupRankPointsAtIndex,
  groupSheetTotalPoints,
  isGroupFinalized,
  orderedGroupPrediction,
} from './groupStandingSheet.js';

describe('isGroupFinalized', () => {
  it('returns true when six group matches are finished', () => {
    const matches = Array.from({ length: 6 }, (_, i) => ({
      group: 'A',
      status: 'finished',
      id: `m${i}`,
    }));
    expect(isGroupFinalized('A', matches)).toBe(true);
  });

  it('returns false when fewer than six matches finished', () => {
    const matches = [{ group: 'A', status: 'finished', id: 'm1' }];
    expect(isGroupFinalized('A', matches)).toBe(false);
  });
});

describe('orderedGroupPrediction', () => {
  it('appends unranked teams after ranked ones', () => {
    expect(orderedGroupPrediction(['A', 'B'], ['A', 'B', 'C', 'D'])).toEqual([
      'A',
      'B',
      'C',
      'D',
    ]);
  });
});

describe('groupRankPointsAtIndex', () => {
  const pred = ['A', 'B', 'C', 'D'];
  const actual = ['A', 'B', 'X', 'D'];

  it('returns null for fourth place', () => {
    expect(groupRankPointsAtIndex(3, pred, actual, true)).toBeNull();
  });

  it('returns zero when group is not finalized', () => {
    expect(groupRankPointsAtIndex(0, pred, actual, false)).toBe(0);
  });

  it('scores first, second and third positions', () => {
    expect(groupRankPointsAtIndex(0, pred, actual, true)).toBe(2);
    expect(groupRankPointsAtIndex(1, pred, actual, true)).toBe(1);
    expect(groupRankPointsAtIndex(2, pred, actual, true)).toBe(0);
  });
});

describe('groupSheetTotalPoints', () => {
  it('returns zero before group is finalized', () => {
    expect(groupSheetTotalPoints(['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D'], false)).toBe(0);
  });

  it('includes bonus when all four match', () => {
    expect(
      groupSheetTotalPoints(['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D'], true),
    ).toBe(7);
  });
});
