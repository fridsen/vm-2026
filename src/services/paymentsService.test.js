import { describe, expect, it } from 'vitest';
import {
  adminFeeSek,
  grossPotSek,
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
