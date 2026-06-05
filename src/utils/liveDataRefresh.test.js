import { describe, expect, it } from 'vitest';
import {
  hasMatchInLiveWindow,
  liveDataPollIntervalMs,
  tournamentMayBeLive,
} from './liveDataRefresh.js';
import { MATCH_DURATION_MS } from './matchSchedule.js';

const kickoff = '2026-06-11T19:00:00.000Z';

function match(overrides = {}) {
  return {
    id: 'm1',
    kickoff,
    result: null,
    ...overrides,
  };
}

describe('tournamentMayBeLive', () => {
  it('is false before first kickoff with no results', () => {
    const before = new Date(kickoff).getTime() - 60_000;
    expect(tournamentMayBeLive([match()], before)).toBe(false);
  });

  it('is true after kickoff', () => {
    const after = new Date(kickoff).getTime() + 60_000;
    expect(tournamentMayBeLive([match()], after)).toBe(true);
  });

  it('is true when any match has a result', () => {
    const before = new Date(kickoff).getTime() - 60_000;
    expect(tournamentMayBeLive([match({ result: { home: 1, away: 0 } })], before)).toBe(true);
  });
});

describe('hasMatchInLiveWindow', () => {
  it('is true during the live window without a result', () => {
    const liveAt = new Date(kickoff).getTime() + 30 * 60_000;
    expect(hasMatchInLiveWindow([match()], liveAt)).toBe(true);
  });

  it('is false after the live window without a result', () => {
    const late = new Date(kickoff).getTime() + MATCH_DURATION_MS + 1;
    expect(hasMatchInLiveWindow([match()], late)).toBe(false);
  });
});

describe('liveDataPollIntervalMs', () => {
  it('returns null before the tournament starts', () => {
    const before = new Date(kickoff).getTime() - 60_000;
    expect(liveDataPollIntervalMs([match()], before)).toBeNull();
  });

  it('polls faster during an active match window', () => {
    const liveAt = new Date(kickoff).getTime() + 30 * 60_000;
    expect(liveDataPollIntervalMs([match()], liveAt)).toBe(30_000);
  });

  it('polls slower between match days', () => {
    const between = new Date(kickoff).getTime() + MATCH_DURATION_MS + 60_000;
    expect(liveDataPollIntervalMs([match()], between)).toBe(60_000);
  });
});
