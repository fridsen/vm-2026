import { describe, expect, it } from 'vitest';
import { REVEAL_PHASE } from '../utils/revealPhases.js';

describe('useRevealSequence contract', () => {
  it('uses stable phase ids for the reveal state machine', () => {
    expect(REVEAL_PHASE.IDLE).toBe('idle');
    expect(REVEAL_PHASE.INTRO).toBe('intro');
    expect(REVEAL_PHASE.TICKER).toBe('ticker');
    expect(REVEAL_PHASE.SCORE).toBe('score');
    expect(REVEAL_PHASE.PREDICTION).toBe('prediction');
    expect(REVEAL_PHASE.POINTS).toBe('points');
  });
});
