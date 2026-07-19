import { describe, expect, it } from 'vitest';
import {
  actualTopThreeTeamIds,
  isBronzeDecided,
  isFinalDecided,
  isPodiumFinalized,
  isPodiumSlotDecided,
  topThreeRankPointsAtIndex,
  topThreeSheetTotalPoints,
} from './topThreeStandingSheet.js';

const finalMatch = {
  round: 'FINAL',
  status: 'finished',
  homeTeamId: 'gold',
  awayTeamId: 'silver',
  result: { home: 2, away: 1 },
};

const bronzeMatch = {
  round: 'BRONZE',
  status: 'finished',
  homeTeamId: 'bronze',
  awayTeamId: 'fourth',
  result: { home: 1, away: 0 },
};

const liveFinal = {
  round: 'FINAL',
  status: 'in_play',
  homeTeamId: 'gold',
  awayTeamId: 'silver',
  result: { home: 1, away: 0 },
};

describe('podium decided flags', () => {
  it('treats bronze as decided when finished', () => {
    expect(isBronzeDecided([bronzeMatch, liveFinal])).toBe(true);
    expect(isFinalDecided([bronzeMatch, liveFinal])).toBe(false);
    expect(isPodiumFinalized([bronzeMatch, liveFinal])).toBe(false);
  });

  it('ignores in-play finals even with a lead', () => {
    expect(isPodiumSlotDecided(0, [bronzeMatch, liveFinal])).toBe(false);
    expect(isPodiumSlotDecided(1, [bronzeMatch, liveFinal])).toBe(false);
    expect(isPodiumSlotDecided(2, [bronzeMatch, liveFinal])).toBe(true);
  });

  it('returns true when final and bronze are finished', () => {
    expect(isPodiumFinalized([finalMatch, bronzeMatch])).toBe(true);
  });
});

describe('actualTopThreeTeamIds', () => {
  it('returns full podium when both matches are finished', () => {
    expect(actualTopThreeTeamIds([finalMatch, bronzeMatch])).toEqual([
      'gold',
      'silver',
      'bronze',
    ]);
  });

  it('returns only bronze while the final is still live', () => {
    expect(actualTopThreeTeamIds([bronzeMatch, liveFinal])).toEqual([
      null,
      null,
      'bronze',
    ]);
  });
});

describe('topThreeRankPointsAtIndex', () => {
  const pred = ['gold', 'silver', 'bronze'];
  const actual = ['gold', 'bra', 'bronze'];

  it('returns zero before a slot is decided', () => {
    expect(topThreeRankPointsAtIndex(0, pred, actual, false)).toBe(0);
  });

  it('scores each podium slot independently', () => {
    expect(topThreeRankPointsAtIndex(0, pred, actual, true)).toBe(15);
    expect(topThreeRankPointsAtIndex(1, pred, actual, true)).toBe(0);
    expect(topThreeRankPointsAtIndex(2, pred, actual, true)).toBe(5);
  });
});

describe('topThreeSheetTotalPoints', () => {
  it('awards bronze points before the final is finished', () => {
    const pred = ['esp', 'arg', 'bronze'];
    const matches = [bronzeMatch, liveFinal];
    const actual = actualTopThreeTeamIds(matches);
    expect(topThreeSheetTotalPoints(pred, actual, matches)).toBe(5);
  });

  it('sums all podium points when both matches are finished', () => {
    const pred = ['gold', 'silver', 'bronze'];
    const matches = [finalMatch, bronzeMatch];
    const actual = actualTopThreeTeamIds(matches);
    expect(topThreeSheetTotalPoints(pred, actual, matches)).toBe(30);
  });
});
