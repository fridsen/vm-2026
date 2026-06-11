import { describe, expect, it } from 'vitest';
import {
  adminFeeSek,
  formatPrizePayoutPcts,
  grossPotSek,
  PRIZE_PAYOUT_PCTS,
  PRIZE_POOL_ADMIN_FEE_PCT,
  prizePoolSek,
} from './paymentsService.js';

describe('prize pool admin fee', () => {
  it('deducts 5% from gross pot', () => {
    expect(PRIZE_POOL_ADMIN_FEE_PCT).toBe(5);
    expect(grossPotSek(200, 37)).toBe(7400);
    expect(adminFeeSek(200, 37)).toBe(370);
    expect(prizePoolSek(200, 37)).toBe(7030);
  });

  it('returns zero when there are no participants', () => {
    expect(grossPotSek(200, 0)).toBe(0);
    expect(adminFeeSek(200, 0)).toBe(0);
    expect(prizePoolSek(200, 0)).toBe(0);
  });
});

describe('prize payout split', () => {
  it('uses top-five 40/25/15/10/5 shares', () => {
    expect(PRIZE_PAYOUT_PCTS).toEqual([40, 25, 15, 10, 5]);
    expect(PRIZE_PAYOUT_PCTS.reduce((sum, pct) => sum + pct, 0)).toBe(95);
    expect(formatPrizePayoutPcts()).toBe('40 / 25 / 15 / 10 / 5');
  });
});
