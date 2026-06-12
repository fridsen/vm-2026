import { describe, expect, it } from 'vitest';
import {
  MATCH_STATE,
  computeGroupStandings,
  flattenMatchesByGroup,
  getMatchDayKey,
  getMatchState,
  liveMatchMinute,
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

  it('trusts football-data in_play status over kickoff window', () => {
    const beforeKickoff = new Date('2026-06-11T20:59:00+02:00').getTime();
    expect(
      getMatchState({ ...match, status: 'in_play', liveScore: { home: 1, away: 0 } }, beforeKickoff),
    ).toBe(MATCH_STATE.LIVE);
  });

  it('uses synced live minute when available', () => {
    expect(
      liveMatchMinute({
        kickoff: '2026-06-11T21:00:00+02:00',
        liveMinute: 78,
      }),
    ).toBe(78);
  });

  it('estimates live minute with halftime break when sync minute is missing', () => {
    const kickoff = '2026-06-11T21:00:00+02:00';
    const at40 = new Date('2026-06-11T21:40:00+02:00').getTime();
    const atHalftime = new Date('2026-06-11T22:00:00+02:00').getTime();
    const at80 = new Date('2026-06-11T22:35:00+02:00').getTime();

    expect(liveMatchMinute({ kickoff }, at40)).toBe(40);
    expect(liveMatchMinute({ kickoff }, atHalftime)).toBe(45);
    expect(liveMatchMinute({ kickoff }, at80)).toBe(80);
  });

  it('does not treat live scores as final results', () => {
    const live = {
      kickoff: '2026-06-11T21:00:00+02:00',
      status: 'in_play',
      liveScore: { home: 0, away: 0 },
      result: null,
    };
    expect(getMatchState(live, Date.now())).toBe(MATCH_STATE.LIVE);
  });

  it('does not infer full time when sync is still scheduled without scores', () => {
    const stale = {
      kickoff: '2026-06-12T04:00:00+02:00',
      status: 'scheduled',
      result: null,
      liveScore: null,
    };
    expect(getMatchState(stale, new Date('2026-06-12T08:00:00+02:00').getTime())).toBe(
      MATCH_STATE.LIVE,
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
