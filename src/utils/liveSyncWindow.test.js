import { describe, expect, it } from 'vitest';
import {
  anyInLiveSyncWindow,
  isInLiveSyncWindow,
  POST_MATCH_MS,
  PRE_MATCH_MS,
} from '../../supabase/functions/_shared/liveSyncWindow.ts';

const kickoff = '2026-06-12T02:00:00.000Z';

describe('liveSyncWindow', () => {
  it('is false well before kickoff', () => {
    const before = new Date(kickoff).getTime() - PRE_MATCH_MS - 60_000;
    expect(isInLiveSyncWindow({ kickoff, status: 'scheduled' }, before)).toBe(false);
  });

  it('is true shortly before kickoff', () => {
    const pre = new Date(kickoff).getTime() - 5 * 60_000;
    expect(isInLiveSyncWindow({ kickoff, status: 'scheduled' }, pre)).toBe(true);
  });

  it('is true during regular time', () => {
    const mid = new Date(kickoff).getTime() + 60 * 60_000;
    expect(isInLiveSyncWindow({ kickoff, status: 'scheduled' }, mid)).toBe(true);
  });

  it('stays true through extra time window', () => {
    const et = new Date(kickoff).getTime() + 120 * 60_000;
    expect(isInLiveSyncWindow({ kickoff, status: 'scheduled' }, et)).toBe(true);
  });

  it('is false long after kickoff + ET buffer', () => {
    const late = new Date(kickoff).getTime() + POST_MATCH_MS + 60_000;
    expect(isInLiveSyncWindow({ kickoff, status: 'scheduled' }, late)).toBe(false);
  });

  it('always polls while status is in_play', () => {
    const late = new Date(kickoff).getTime() + POST_MATCH_MS + 60_000;
    expect(isInLiveSyncWindow({ kickoff, status: 'in_play' }, late)).toBe(true);
  });

  it('returns true if any row is in window', () => {
    const now = new Date(kickoff).getTime() + 30 * 60_000;
    expect(
      anyInLiveSyncWindow(
        [
          { kickoff: '2026-06-20T02:00:00.000Z', status: 'scheduled' },
          { kickoff, status: 'scheduled' },
        ],
        now,
      ),
    ).toBe(true);
  });
});
