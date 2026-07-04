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

  it('breaks kickoff ties stably by group then id', () => {
    const groupB = { ...match('b-match', '2026-06-15T18:00:00Z'), group: 'B' };
    const groupA = { ...match('a-match', '2026-06-15T18:00:00Z'), group: 'A' };
    expect(selectTodayMatches([groupB, groupA], now).map((m) => m.id)).toEqual([
      'a-match',
      'b-match',
    ]);
    expect(selectTodayMatches([groupA, groupB], now).map((m) => m.id)).toEqual([
      'a-match',
      'b-match',
    ]);
  });

  it('includes knockout matches on the same day', () => {
    const group = match('g', '2026-06-15T18:00:00Z');
    const knockout = {
      id: 'ko',
      kickoff: '2026-06-15T21:00:00Z',
      homeTeamId: 'a',
      awayTeamId: 'b',
      round: 'R16',
    };
    expect(selectTodayMatches([knockout, group], now).map((m) => m.id)).toEqual(['g', 'ko']);
  });
});
