import { describe, expect, it } from 'vitest';
import { teams } from './teams.js';
import {
  GROUP_MATCH_SCHEDULE,
  groupMatchScheduleForTeams,
} from './groupMatchSchedule.js';

describe('GROUP_MATCH_SCHEDULE', () => {
  it('contains the complete 72-match group stage with unique team pairs', () => {
    const pairs = new Set(
      GROUP_MATCH_SCHEDULE.map((match) => [match.home, match.away].sort().join(':')),
    );

    expect(GROUP_MATCH_SCHEDULE).toHaveLength(72);
    expect(pairs.size).toBe(72);
  });

  it('only references known teams', () => {
    const teamIds = new Set(teams.map((team) => team.id));
    const unknown = GROUP_MATCH_SCHEDULE.flatMap((match) =>
      [match.home, match.away].filter((teamId) => !teamIds.has(teamId)),
    );

    expect(unknown).toEqual([]);
  });

  it('maps broadcaster and Swedish kickoff time independent of home/away order', () => {
    expect(groupMatchScheduleForTeams('MEX', 'RSA')).toMatchObject({
      kickoff: '2026-06-11T21:00:00+02:00',
      channel: 'tv4',
      venue: 'Mexico City',
    });
    expect(groupMatchScheduleForTeams('RSA', 'MEX')).toMatchObject({
      kickoff: '2026-06-11T21:00:00+02:00',
      channel: 'tv4',
    });
  });
});
