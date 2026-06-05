import { describe, expect, it } from 'vitest';
import {
  formatMatchPredictionLabel,
  normalizeMatchPrediction,
} from './matchPredictionDisplay.js';
import { predictionSign } from './signFromScore.js';

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
});
