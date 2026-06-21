import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearSeenMatchIds,
  markMatchSeen,
  readSeenMatchIds,
  resultRevealStorageKey,
} from './resultRevealStorage.js';

function createStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  };
}

describe('resultRevealStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses per-user storage keys', () => {
    expect(resultRevealStorageKey('user-1')).toBe('vm2026:resultRevealSeen:v1:user-1');
  });

  it('marks and reads seen match ids', () => {
    vi.stubGlobal('localStorage', createStorage());
    markMatchSeen('user-1', 'MEX');
    markMatchSeen('user-1', 'CAN');

    const seen = readSeenMatchIds('user-1');
    expect(seen.has('MEX')).toBe(true);
    expect(seen.has('CAN')).toBe(true);
    expect(seen.size).toBe(2);
  });

  it('clears seen match ids', () => {
    vi.stubGlobal('localStorage', createStorage());
    markMatchSeen('user-1', 'MEX');
    clearSeenMatchIds('user-1');
    expect(readSeenMatchIds('user-1').size).toBe(0);
  });

  it('returns empty set for corrupt json', () => {
    vi.stubGlobal('localStorage', createStorage());
    localStorage.setItem(resultRevealStorageKey('user-1'), '{not-json');
    expect(readSeenMatchIds('user-1').size).toBe(0);
  });
});
