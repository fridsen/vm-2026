import { describe, expect, it } from 'vitest';
import {
  actualTopThreeTeamIds,
  isPodiumFinalized,
  topThreeRankPointsAtIndex,
  topThreeSheetTotalPoints,
} from './topThreeStandingSheet.js';

const finalMatch = {
  round: 'FINAL',
  homeTeamId: 'gold',
  awayTeamId: 'silver',
  result: { home: 2, away: 1 },
};

const bronzeMatch = {
  round: 'BRONZE',
  homeTeamId: 'bronze',
  awayTeamId: 'fourth',
  result: { home: 1, away: 0 },
};

describe('isPodiumFinalized', () => {
  it('returns true when final and bronze have winners', () => {
    expect(isPodiumFinalized([finalMatch, bronzeMatch])).toBe(true);
  });

  it('returns false when bronze is missing', () => {
    expect(isPodiumFinalized([finalMatch])).toBe(false);
  });
});

describe('actualTopThreeTeamIds', () => {
  it('returns gold, silver, bronze team ids', () => {
    expect(actualTopThreeTeamIds([finalMatch, bronzeMatch])).toEqual([
      'gold',
      'silver',
      'bronze',
    ]);
  });
});

describe('topThreeRankPointsAtIndex', () => {
  const pred = ['gold', 'silver', 'bronze'];
  const actual = ['gold', 'bra', 'bronze'];

  it('returns zero before podium is finalized', () => {
    expect(topThreeRankPointsAtIndex(0, pred, actual, false)).toBe(0);
  });

  it('scores each podium slot independently', () => {
    expect(topThreeRankPointsAtIndex(0, pred, actual, true)).toBe(15);
    expect(topThreeRankPointsAtIndex(1, pred, actual, true)).toBe(0);
    expect(topThreeRankPointsAtIndex(2, pred, actual, true)).toBe(5);
  });
});

describe('topThreeSheetTotalPoints', () => {
  it('returns zero before podium is finalized', () => {
    expect(topThreeSheetTotalPoints(['A', 'B', 'C'], ['A', 'B', 'C'], false)).toBe(0);
  });

  it('sums podium points when finalized', () => {
    expect(topThreeSheetTotalPoints(['A', 'B', 'C'], ['A', 'B', 'C'], true)).toBe(30);
  });
});
