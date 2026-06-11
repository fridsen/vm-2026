import { describe, expect, it } from 'vitest';
import {
  buildPerMatchPoints,
  perMatchScrollIndex,
} from './matchPointsPerGame.js';

describe('matchPointsPerGame', () => {
  const matches = [
    { id: 'm1', kickoff: '2026-06-11T19:00:00Z', status: 'finished', result: { home: 2, away: 0 } },
    { id: 'm2', kickoff: '2026-06-12T19:00:00Z', status: 'finished', result: { home: 1, away: 1 } },
    { id: 'm3', kickoff: '2026-06-13T19:00:00Z', status: 'scheduled', result: null },
  ];

  it('orders matches by kickoff and marks upcoming as pending', () => {
    const items = buildPerMatchPoints(matches, { matches: {} });
    expect(items.map((i) => i.matchId)).toEqual(['m1', 'm2', 'm3']);
    expect(items[0].earned).toBe(0);
    expect(items[2].pending).toBe(true);
  });

  it('marks a perfect tip with perfect=true', () => {
    const items = buildPerMatchPoints(matches, {
      matches: { m1: { home: 2, away: 0, outcome: '1' } },
    });
    expect(items[0].earned).toBe(6);
    expect(items[0].perfect).toBe(true);
  });

  it('scrolls when more than ten matches are finished', () => {
    const finished = Array.from({ length: 12 }, (_, i) => ({
      id: `m${i}`,
      kickoff: `2026-06-${String(i + 1).padStart(2, '0')}T19:00:00Z`,
      status: 'finished',
      result: { home: 1, away: 0 },
    }));
    const items = buildPerMatchPoints(finished, { matches: {} });
    expect(perMatchScrollIndex(items)).toBe(2);
  });
});
