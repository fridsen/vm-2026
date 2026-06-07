// Reads cached RSS headlines from news_articles (populated by sync-news).
// Client-side localStorage cache avoids a Supabase round-trip on every app open.

import { supabase, unwrap } from './supabaseClient.js';
import { readNewsCache, writeNewsCache } from '../utils/newsCache.js';
import { interleaveNewsBySource } from '../utils/interleaveNewsBySource.js';

export const NEWS_ARTICLE_LIMIT = 50;

function rowToArticle(r) {
  return {
    id: r.id,
    title: r.title,
    summary: r.summary ?? null,
    url: r.url,
    source: r.source,
    imageUrl: r.image_url ?? null,
    publishedAt: r.published_at,
  };
}

async function fetchFromDatabase(limit) {
  const rows = unwrap(
    await supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit),
  );
  return interleaveNewsBySource(rows.map(rowToArticle));
}

/**
 * Returns news from localStorage when fresh; otherwise fetches from Supabase
 * and refreshes the cache. RSS feeds are never called from the client.
 */
export async function fetchLatestNews(limit = NEWS_ARTICLE_LIMIT, { force = false } = {}) {
  const cached = readNewsCache();
  if (!force && cached?.fresh) {
    return interleaveNewsBySource(cached.articles).slice(0, limit);
  }

  const articles = await fetchFromDatabase(Math.max(limit, NEWS_ARTICLE_LIMIT));
  writeNewsCache(articles);
  return articles.slice(0, limit);
}

export { getCachedNews } from '../utils/newsCache.js';
