import { describe, expect, it, vi } from 'vitest';
import { clearSupabaseAuthStorage } from './supabaseAuthStorage.js';

describe('clearSupabaseAuthStorage', () => {
  it('removes Supabase auth token keys only', () => {
    const store = new Map([
      ['sb-project-auth-token', 'session'],
      ['sb-project-auth-token-code-verifier', 'verifier'],
      ['vm2026_news_cache_v3', 'news'],
    ]);
    vi.stubGlobal('localStorage', {
      get length() {
        return store.size;
      },
      key: (index) => [...store.keys()][index] ?? null,
      removeItem: (key) => {
        store.delete(key);
      },
    });

    clearSupabaseAuthStorage();

    expect(store.has('sb-project-auth-token')).toBe(false);
    expect(store.has('sb-project-auth-token-code-verifier')).toBe(false);
    expect(store.has('vm2026_news_cache_v3')).toBe(true);
  });
});
