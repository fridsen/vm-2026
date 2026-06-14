import { describe, expect, it } from 'vitest';
import { MATCH_DURATION_MS } from './matchSchedule.js';
import {
  formatMalserviceFinishedScore,
  formatTeletextRank,
  getMalserviceRowVariant,
  MALSERVICE_ROW,
  sortMalserviceMatches,
} from './teletextDisplay.js';

const now = new Date('2026-06-15T20:00:00Z').getTime();

function match(id, kickoff, overrides = {}) {
  return { id, kickoff, homeTeamId: 'a', awayTeamId: 'b', group: 'A', ...overrides };
}

describe('teletext målservice rows', () => {
  it('classifies live, finished, and upcoming variants', () => {
    const live = match('live', '2026-06-15T18:00:00Z', {
      status: 'in_play',
      liveScore: { home: 1, away: 1 },
    });
    const finished = match('ft', '2026-06-15T15:00:00Z', {
      status: 'finished',
      result: { home: 1, away: 0 },
    });
    const upcoming = match('up', '2026-06-15T22:00:00Z');

    expect(getMalserviceRowVariant(live, now)).toBe(MALSERVICE_ROW.LIVE);
    expect(getMalserviceRowVariant(finished, now)).toBe(MALSERVICE_ROW.FINISHED);
    expect(getMalserviceRowVariant(upcoming, now)).toBe(MALSERVICE_ROW.UPCOMING);
  });

  it('never returns X-X for finished score formatting', () => {
    const finished = match('ft', '2026-06-15T15:00:00Z', { status: 'finished' });
    expect(formatMalserviceFinishedScore(finished)).toBe('–');
    expect(formatMalserviceFinishedScore({
      ...finished,
      result: { home: 2, away: 1 },
    })).toBe('2-1');
  });

  it('orders live before finished before upcoming', () => {
    const live = match('live', '2026-06-15T21:00:00Z', {
      status: 'in_play',
      liveScore: { home: 0, away: 0 },
    });
    const finishedAt = now - 30 * 60 * 1000;
    const kickoff = new Date(finishedAt - MATCH_DURATION_MS).toISOString();
    const finished = match('ft', kickoff, {
      status: 'finished',
      result: { home: 1, away: 0 },
    });
    const upcoming = match('up', '2026-06-15T22:00:00Z');

    const sorted = sortMalserviceMatches([upcoming, finished, live], now);
    expect(sorted.map((m) => m.id)).toEqual(['live', 'ft', 'up']);
  });
});

describe('formatTeletextRank', () => {
  it('pads single-digit ranks for alignment', () => {
    expect(formatTeletextRank(1)).toBe(' 1.');
    expect(formatTeletextRank(9)).toBe(' 9.');
    expect(formatTeletextRank(10)).toBe('10.');
    expect(formatTeletextRank(11)).toBe('11.');
  });
});
