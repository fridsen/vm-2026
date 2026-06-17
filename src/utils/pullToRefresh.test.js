import { describe, expect, it } from 'vitest';
import {
  canStartPull,
  dampedPullDistance,
  shouldTriggerRefresh,
} from './pullToRefresh.js';

describe('pullToRefresh', () => {
  it('dampens and caps pull distance', () => {
    expect(dampedPullDistance(0)).toBe(0);
    expect(dampedPullDistance(100)).toBe(45);
    expect(dampedPullDistance(300)).toBe(96);
  });

  it('only allows pull in standalone at scroll top without sheets', () => {
    expect(canStartPull({ standalone: true, scrollTop: 0 })).toBe(true);
    expect(canStartPull({ standalone: true, scrollTop: 12 })).toBe(false);
    expect(canStartPull({ standalone: false, scrollTop: 0 })).toBe(false);
    expect(canStartPull({ standalone: true, scrollTop: 0, sheetOpen: true })).toBe(false);
  });

  it('triggers refresh past threshold', () => {
    expect(shouldTriggerRefresh(63)).toBe(false);
    expect(shouldTriggerRefresh(64)).toBe(true);
  });
});
