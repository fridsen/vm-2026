import { describe, expect, it } from 'vitest';
import {
  scoreGroupMatch,
  scoreGroupStanding,
  scoreWorldCupWinner,
  summarizePoints,
} from './scoring.js';

describe('scoreGroupMatch', () => {
  it('awards max 6 points for exact score and correct sign', () => {
    const result = scoreGroupMatch(
      { home: 2, away: 1, outcome: '1' },
      { home: 2, away: 1 },
    );

    expect(result).toEqual({
      points: 6,
      breakdown: { sign: 3, homeGoals: 1, awayGoals: 1, exact: 1 },
    });
  });

  it('scores explicit 1X2 pick independently from the predicted score', () => {
    const result = scoreGroupMatch(
      { home: 0, away: 1, outcome: 'X' },
      { home: 0, away: 0 },
    );

    expect(result.points).toBe(4);
    expect(result.breakdown).toEqual({ sign: 3, homeGoals: 1, awayGoals: 0, exact: 0 });
  });

  it('returns zero for missing predictions or actual results', () => {
    expect(scoreGroupMatch(null, { home: 1, away: 0 }).points).toBe(0);
    expect(scoreGroupMatch({ home: 1, away: 0 }, null).points).toBe(0);
  });
});

describe('scoreGroupStanding', () => {
  it('awards max 7 points for a perfect group table', () => {
    const result = scoreGroupStanding(['A', 'B', 'C', 'D'], ['A', 'B', 'C', 'D']);

    expect(result).toEqual({
      points: 7,
      breakdown: { first: 2, second: 1, third: 1, allFourBonus: 3 },
    });
  });

  it('awards positional points without the all-four bonus', () => {
    const result = scoreGroupStanding(['A', 'B', 'D', 'C'], ['A', 'B', 'C', 'D']);

    expect(result.points).toBe(3);
    expect(result.breakdown).toEqual({ first: 2, second: 1, third: 0, allFourBonus: 0 });
  });
});

describe('knockout scoring', () => {
  it('awards 20 points for the correct World Cup winner', () => {
    expect(scoreWorldCupWinner('SWE', 'SWE')).toEqual({
      points: 20,
      breakdown: { correct: true },
    });
    expect(scoreWorldCupWinner('SWE', 'BRA').points).toBe(0);
  });
});

describe('summarizePoints', () => {
  it('sums all categories into a total', () => {
    const summary = summarizePoints({
      groupMatches: [{ points: 6 }, { points: 4 }],
      groupStandings: [{ points: 7 }],
      knockout: {
        R32: { points: 2 },
        R16: { points: 3 },
        QF: { points: 3 },
        SF: { points: 4 },
        BRONZE: { points: 5 },
        FINAL: { points: 10 },
        WINNER: { points: 20 },
      },
      topScorers: { points: 8 },
    });

    expect(summary).toEqual({
      matchPoints: 10,
      groupPoints: 7,
      knockoutPoints: 47,
      topScorerPoints: 8,
      total: 72,
    });
  });
});
