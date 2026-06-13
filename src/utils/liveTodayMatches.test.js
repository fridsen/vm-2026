import { describe, expect, it } from 'vitest';
import { sortMatchesByState } from './liveTodayMatches.js';
import { MATCH_STATE } from './matchSchedule.js';

const now = new Date('2026-06-15T20:00:00Z').getTime();

function match(id, kickoff, result = null) {
  return { id, kickoff, result, homeTeamId: 'a', awayTeamId: 'b', group: 'A' };
}

describe('sortMatchesByState', () => {
  it('orders live before upcoming before finished', () => {
    const live = match('live', '2026-06-15T19:00:00Z');
    const upcoming = match('up', '2026-06-15T21:00:00Z');
    const finished = match('ft', '2026-06-15T15:00:00Z', { home: 1, away: 0 });

    const sorted = sortMatchesByState([finished, upcoming, live], now);
    expect(sorted.map((m) => m.id)).toEqual(['live', 'up', 'ft']);
  });
});
