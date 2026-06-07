import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  NEWS_CACHE_TTL_MS,
  getCachedNews,
  readNewsCache,
  writeNewsCache,
} from './newsCache.js';

function createStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  };
}

describe('newsCache', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns cached articles while fresh', () => {
    vi.stubGlobal('localStorage', createStorage());
    writeNewsCache([{ id: '1', title: 'VM-nyhet' }]);

    const cached = readNewsCache();
    expect(cached?.fresh).toBe(true);
    expect(getCachedNews()).toEqual([{ id: '1', title: 'VM-nyhet' }]);
  });

  it('marks cache stale after TTL', () => {
    vi.stubGlobal('localStorage', createStorage());
    writeNewsCache([{ id: '1', title: 'VM-nyhet' }]);

    const stored = JSON.parse(globalThis.localStorage.getItem('vm2026_news_cache_v8'));
    stored.fetchedAt = Date.now() - NEWS_CACHE_TTL_MS - 1;
    globalThis.localStorage.setItem('vm2026_news_cache_v8', JSON.stringify(stored));

    expect(readNewsCache()?.fresh).toBe(false);
    expect(getCachedNews()).toEqual([{ id: '1', title: 'VM-nyhet' }]);
  });
});
