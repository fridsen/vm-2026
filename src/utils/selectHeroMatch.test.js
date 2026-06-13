import { describe, expect, it } from 'vitest';
import { HERO_VARIANT, selectHeroMatch } from './selectHeroMatch.js';
import { MATCH_DURATION_MS } from './matchSchedule.js';

const now = new Date('2026-06-15T20:00:00Z').getTime();

function match(id, kickoff, overrides = {}) {
  return {
    id,
    kickoff,
    homeTeamId: 'a',
    awayTeamId: 'b',
    group: 'A',
    ...overrides,
  };
}

describe('selectHeroMatch', () => {
  it('picks earliest live match when multiple are live', () => {
    const early = match('live1', '2026-06-15T18:00:00Z', { status: 'in_play', liveScore: { home: 0, away: 0 } });
    const late = match('live2', '2026-06-15T19:30:00Z', { status: 'in_play', liveScore: { home: 1, away: 0 } });
    const result = selectHeroMatch([late, early], now);
    expect(result).toEqual({ match: early, variant: HERO_VARIANT.LIVE });
  });

  it('picks recently finished within 1 hour', () => {
    const finishedAt = now - 30 * 60 * 1000;
    const kickoff = new Date(finishedAt - MATCH_DURATION_MS).toISOString();
    const recent = match('ft', kickoff, {
      status: 'finished',
      result: { home: 2, away: 1 },
    });
    const upcoming = match('up', '2026-06-15T22:00:00Z');
    const result = selectHeroMatch([upcoming, recent], now);
    expect(result).toEqual({ match: recent, variant: HERO_VARIANT.RECENT_FINISHED });
  });

  it('skips finished matches older than 1 hour', () => {
    const finishedAt = now - 2 * 60 * 60 * 1000;
    const kickoff = new Date(finishedAt - MATCH_DURATION_MS).toISOString();
    const old = match('old', kickoff, {
      status: 'finished',
      result: { home: 1, away: 0 },
    });
    const upcoming = match('up', '2026-06-16T18:00:00Z');
    const result = selectHeroMatch([old, upcoming], now);
    expect(result).toEqual({ match: upcoming, variant: HERO_VARIANT.UPCOMING });
  });

  it('falls back to next upcoming when no live or recent finished', () => {
    const upcoming = match('up1', '2026-06-16T18:00:00Z');
    const later = match('up2', '2026-06-17T18:00:00Z');
    const result = selectHeroMatch([later, upcoming], now);
    expect(result).toEqual({ match: upcoming, variant: HERO_VARIANT.UPCOMING });
  });

  it('returns null when no matches', () => {
    expect(selectHeroMatch([], now)).toBeNull();
  });
});
