import { describe, expect, it } from 'vitest';
import { buildRevealMatch, synthesizeGoalEvents } from './buildRevealMatch.js';

describe('synthesizeGoalEvents', () => {
  it('builds running score details for goals', () => {
    const events = synthesizeGoalEvents(2, 1);
    expect(events).toHaveLength(3);
    expect(events[0]).toMatchObject({ team: 'home', detail: '1–0', type: 'goal' });
    expect(events[1]).toMatchObject({ team: 'home', detail: '2–0', type: 'goal' });
    expect(events[2]).toMatchObject({ team: 'away', detail: '2–1', type: 'goal' });
  });

  it('returns empty list for 0-0', () => {
    expect(synthesizeGoalEvents(0, 0)).toEqual([]);
  });
});

describe('buildRevealMatch', () => {
  const match = {
    id: 'MEX',
    group: 'A',
    round: 1,
    kickoff: '2026-06-20T18:00:00Z',
    result: { home: 2, away: 1 },
  };

  it('maps teams, prediction, and verdict', () => {
    const payload = buildRevealMatch({
      match,
      prediction: { home: 2, away: 1 },
      homeTeam: { code: 'MEX', name: 'Mexiko', flag: '🇲🇽' },
      awayTeam: { code: 'KOR', name: 'Sydkorea', flag: '🇰🇷' },
      events: [],
    });

    expect(payload.matchId).toBe('MEX');
    expect(payload.home.fullName).toBe('Mexiko');
    expect(payload.userPrediction).toBe('2-1');
    expect(payload.userPoints).toBe(6);
    expect(payload.verdict).toBe('Exakt rätt!');
    expect(payload.events.length).toBe(3);
  });
});
