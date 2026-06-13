import { describe, expect, it } from 'vitest';
import { selectTodayMatches } from './selectTodayMatches.js';

const now = new Date('2026-06-15T20:00:00Z').getTime();

function match(id, kickoff) {
  return { id, kickoff, homeTeamId: 'a', awayTeamId: 'b', group: 'A' };
}

describe('selectTodayMatches', () => {
  it('returns only today matches sorted by kickoff', () => {
    const early = match('e', '2026-06-15T15:00:00Z');
    const late = match('l', '2026-06-15T21:00:00Z');
    const other = match('o', '2026-06-16T18:00:00Z');
    const result = selectTodayMatches([late, other, early], now);
    expect(result.map((m) => m.id)).toEqual(['e', 'l']);
  });

  it('returns empty array when no matches today', () => {
    const other = match('o', '2026-06-16T18:00:00Z');
    expect(selectTodayMatches([other], now)).toEqual([]);
  });
});
