import { describe, expect, it } from 'vitest';
import {
  MATCH_STATE,
  computeGroupStandings,
  flattenMatchesByGroup,
  getMatchDayKey,
  getMatchState,
} from './matchSchedule.js';

describe('match state', () => {
  const match = { kickoff: '2026-06-11T21:00:00+02:00', result: null };

  it('classifies upcoming, live, and finished matches', () => {
    expect(getMatchState(match, new Date('2026-06-11T20:59:00+02:00').getTime())).toBe(
      MATCH_STATE.UPCOMING,
    );
    expect(getMatchState(match, new Date('2026-06-11T21:30:00+02:00').getTime())).toBe(
      MATCH_STATE.LIVE,
    );
    expect(getMatchState(match, new Date('2026-06-11T23:00:00+02:00').getTime())).toBe(
      MATCH_STATE.FINISHED,
    );
  });

  it('treats explicit results as finished', () => {
    expect(getMatchState({ ...match, result: { home: 1, away: 0 } }, Date.now())).toBe(
      MATCH_STATE.FINISHED,
    );
  });
});

describe('schedule helpers', () => {
  it('uses the local calendar date for match day keys', () => {
    expect(getMatchDayKey('2026-06-12T04:00:00+02:00')).toBe('2026-06-12');
  });

  it('flattens matches by group and kickoff order', () => {
    const matches = [
      { id: 'b2', group: 'B', kickoff: '2026-06-13T00:00:00+02:00' },
      { id: 'a2', group: 'A', kickoff: '2026-06-12T00:00:00+02:00' },
      { id: 'a1', group: 'A', kickoff: '2026-06-11T00:00:00+02:00' },
    ];

    expect(flattenMatchesByGroup(matches).map((match) => match.id)).toEqual(['a1', 'a2', 'b2']);
  });
});

describe('computeGroupStandings', () => {
  const teams = [
    { id: 'A', name: 'Alpha' },
    { id: 'B', name: 'Beta' },
    { id: 'C', name: 'Charlie' },
  ];

  it('sorts by points, goal difference, goals for, then name', () => {
    const standings = computeGroupStandings(
      [
        {
          kickoff: '2026-06-11T12:00:00+02:00',
          homeTeamId: 'A',
          awayTeamId: 'B',
          result: { home: 2, away: 0 },
        },
        {
          kickoff: '2026-06-12T12:00:00+02:00',
          homeTeamId: 'C',
          awayTeamId: 'A',
          result: { home: 1, away: 0 },
        },
        {
          kickoff: '2026-06-13T12:00:00+02:00',
          homeTeamId: 'B',
          awayTeamId: 'C',
          result: { home: 3, away: 0 },
        },
      ],
      teams,
    );

    expect(standings.map((row) => row.team.id)).toEqual(['B', 'A', 'C']);
    expect(standings[0]).toMatchObject({ points: 3, gd: 1, gf: 3 });
  });
});
