const CACHE_KEY = 'vm2026_news_cache_v8';

/** Align with server cron (sync-news every 30 min). */
export const NEWS_CACHE_TTL_MS = 30 * 60 * 1000;

export function readNewsCache() {
  try {
    const raw = globalThis.localStorage?.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.fetchedAt !== 'number' || !Array.isArray(parsed.articles)) {
      return null;
    }

    const ageMs = Date.now() - parsed.fetchedAt;
    return {
      articles: parsed.articles,
      fetchedAt: parsed.fetchedAt,
      fresh: ageMs < NEWS_CACHE_TTL_MS,
    };
  } catch {
    return null;
  }
}

export function writeNewsCache(articles) {
  globalThis.localStorage?.setItem(
    CACHE_KEY,
    JSON.stringify({ fetchedAt: Date.now(), articles }),
  );
}

export function getCachedNews(limit = 50) {
  const cached = readNewsCache();
  if (!cached) return null;
  return cached.articles.slice(0, limit);
}
