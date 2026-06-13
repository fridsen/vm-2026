import { describe, expect, it } from 'vitest';
import {
  formatMatchPredictionLabel,
  formatTipLabel,
  normalizeMatchPrediction,
} from './matchPredictionDisplay.js';
import { predictionSign } from './signFromScore.js';

const teams = {
  homeTeam: { id: 'POR', code: 'POR', name: 'Portugal' },
  awayTeam: { id: 'ESP', code: 'ESP', name: 'Spanien' },
};

describe('matchPredictionDisplay', () => {
  it('uses explicit outcome over score-derived sign', () => {
    const pred = { home: 0, away: 1, outcome: 'X' };
    expect(predictionSign(pred)).toBe('X');
    expect(formatMatchPredictionLabel(pred)).toBe('0-1 (X)');
  });

  it('coerces string scores from jsonb', () => {
    const pred = normalizeMatchPrediction({ home: '2', away: '10', outcome: '2' });
    expect(pred.home).toBe(2);
    expect(pred.away).toBe(10);
    expect(formatMatchPredictionLabel(pred)).toBe('2-10 (2)');
  });

  it('derives sign from score when outcome missing', () => {
    expect(formatMatchPredictionLabel({ home: 3, away: 1 })).toBe('3-1 (1)');
  });

  describe('formatTipLabel', () => {
    it('formats home win with team name', () => {
      expect(formatTipLabel({ home: 2, away: 1, outcome: '1' }, teams)).toBe(
        '2-1 · Portugal',
      );
    });

    it('formats away win with team name', () => {
      expect(formatTipLabel({ home: 1, away: 2, outcome: '2' }, teams)).toBe(
        '1-2 · Spanien',
      );
    });

    it('formats draw as Oavgjort', () => {
      expect(formatTipLabel({ home: 1, away: 1, outcome: 'X' }, teams)).toBe(
        '1-1 · Oavgjort',
      );
      expect(formatTipLabel({ home: 1, away: 1 }, teams)).toBe('1-1 · Oavgjort');
    });

    it('formats compact labels with team codes', () => {
      expect(
        formatTipLabel({ home: 2, away: 1, outcome: '1' }, teams, { compact: true }),
      ).toBe('2-1 · POR');
      expect(
        formatTipLabel({ home: 1, away: 1, outcome: 'X' }, teams, { compact: true }),
      ).toBe('1-1 · Oavgjort');
    });
  });
});
