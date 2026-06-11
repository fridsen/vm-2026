import { describe, expect, it } from 'vitest';
import { aggregateMatchPointsBreakdown } from './matchPointsBreakdown.js';

const match = (id, result, status = 'finished') => ({
  id,
  result,
  status,
  kickoff: '2026-06-15T18:00:00Z',
});

describe('aggregateMatchPointsBreakdown', () => {
  it('returns zero earned and possible when no matches are finished', () => {
    const result = aggregateMatchPointsBreakdown(
      [match('m1', null, 'scheduled')],
      { matches: { m1: { home: 1, away: 0 } } },
    );

    expect(result.finishedCount).toBe(0);
    expect(result.earnedTotal).toBe(0);
    expect(result.rows.every((r) => r.earned === 0 && r.possible === 0)).toBe(true);
  });

  it('ignores in_play scores until the match is finished', () => {
    const result = aggregateMatchPointsBreakdown(
      [
        {
          id: 'm1',
          status: 'in_play',
          result: null,
          liveScore: { home: 2, away: 1 },
          kickoff: '2026-06-15T18:00:00Z',
        },
      ],
      { matches: { m1: { home: 2, away: 1, outcome: '1' } } },
    );

    expect(result.finishedCount).toBe(0);
    expect(result.earnedTotal).toBe(0);
  });

  it('accumulates possible points per finished match regardless of user tip', () => {
    const result = aggregateMatchPointsBreakdown(
      [match('m1', { home: 2, away: 1 }), match('m2', { home: 0, away: 0 })],
      { matches: {} },
    );

    expect(result.finishedCount).toBe(2);
    expect(result.rows.find((r) => r.key === 'sign')).toEqual({
      key: 'sign',
      label: 'Tecken',
      earned: 0,
      possible: 6,
      pct: 0,
    });
    expect(result.rows.find((r) => r.key === 'homeGoals').possible).toBe(2);
    expect(result.rows.find((r) => r.key === 'awayGoals').possible).toBe(2);
    expect(result.rows.find((r) => r.key === 'exact').possible).toBe(2);
  });

  it('sums partial earned points across finished matches', () => {
    const result = aggregateMatchPointsBreakdown(
      [match('m1', { home: 2, away: 1 }), match('m2', { home: 0, away: 0 })],
      {
        matches: {
          m1: { home: 2, away: 1, outcome: '1' },
          m2: { home: 1, away: 0, outcome: '1' },
        },
      },
    );

    expect(result.earnedTotal).toBe(7);
    expect(result.rows.find((r) => r.key === 'sign').earned).toBe(3);
    expect(result.rows.find((r) => r.key === 'homeGoals').earned).toBe(1);
    expect(result.rows.find((r) => r.key === 'awayGoals').earned).toBe(2);
    expect(result.rows.find((r) => r.key === 'exact').earned).toBe(1);
  });

  it('exposes dashboard total rows with combined goal points', () => {
    const result = aggregateMatchPointsBreakdown(
      [match('m1', { home: 2, away: 1 })],
      { matches: { m1: { home: 2, away: 1, outcome: '1' } } },
    );

    expect(result.totalRows).toEqual([
      { key: 'sign', label: 'Rätt tecken', dotClass: 'is-dark', earned: 3 },
      { key: 'goals', label: 'Rätt antal mål', dotClass: 'is-mid', earned: 2 },
      { key: 'exact', label: 'Bonuspoäng', dotClass: 'is-light', earned: 1 },
    ]);
  });

  it('awards max 6 points for a perfect single match', () => {
    const result = aggregateMatchPointsBreakdown(
      [match('m1', { home: 2, away: 1 })],
      { matches: { m1: { home: 2, away: 1, outcome: '1' } } },
    );

    expect(result.earnedTotal).toBe(6);
    expect(result.rows.find((r) => r.key === 'sign').pct).toBe(100);
    expect(result.rows.find((r) => r.key === 'exact').pct).toBe(100);
  });
});
