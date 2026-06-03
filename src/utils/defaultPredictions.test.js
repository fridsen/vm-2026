import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MATCH,
  defaultGroupStanding,
  defaultWinnerTeamId,
} from './defaultPredictions.js';

describe('defaultPredictions', () => {
  it('uses 0-0 X for empty match tips', () => {
    expect(DEFAULT_MATCH).toEqual({ home: 0, away: 0, outcome: 'X' });
  });

  it('orders group teams by first fixture appearance', () => {
    const matches = [
      { group: 'A', homeTeamId: 'mex', awayTeamId: 'rsa', kickoff: '2026-06-11T21:00:00+02:00' },
      { group: 'A', homeTeamId: 'kor', awayTeamId: 'mex', kickoff: '2026-06-12T18:00:00+02:00' },
    ];
    expect(defaultGroupStanding('A', matches)).toEqual(['mex', 'rsa', 'kor']);
  });

  it('picks first team in Swedish alphabetical order', () => {
    const teams = [
      { id: 'swe', name: 'Sverige' },
      { id: 'bra', name: 'Brasilien' },
      { id: 'arg', name: 'Argentina' },
    ];
    expect(defaultWinnerTeamId(teams)).toBe('arg');
  });
});
