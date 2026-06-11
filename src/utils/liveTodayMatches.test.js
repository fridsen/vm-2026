import { describe, expect, it } from 'vitest';
import { sortMatchesByState, selectCarouselMatches } from './liveTodayMatches.js';
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

describe('selectCarouselMatches', () => {
  it('returns today matches when any exist', () => {
    const today = match('t1', '2026-06-15T21:00:00Z');
    const other = match('t2', '2026-06-16T18:00:00Z');
    const { matches, isToday } = selectCarouselMatches([today, other], now);
    expect(isToday).toBe(true);
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('t1');
  });

  it('falls back to upcoming when no matches today', () => {
    const upcoming = match('up', '2026-06-16T18:00:00Z');
    const finished = match('ft', '2026-06-14T18:00:00Z', { home: 0, away: 0 });
    const { matches, isToday } = selectCarouselMatches([upcoming, finished], now);
    expect(isToday).toBe(false);
    expect(matches.map((m) => m.id)).toEqual(['up']);
  });
});
