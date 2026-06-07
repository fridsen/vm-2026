// sync-news Edge Function.
//
// Pulls Swedish sports RSS feeds, filters for VM/fotboll relevance, and
// upserts the top headlines into news_articles for the dashboard.
//
// Trigger:
//   - Scheduled via pg_cron (see supabase/migrations/.../sync_news_cron.sql) OR
//   - Manually: curl -X POST "$SUPABASE_URL/functions/v1/sync-news" \
//                    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

// deno-lint-ignore-file no-external-import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { fetchFotbollskanalenArticles } from '../_shared/fotbollskanalen.ts';
import {
  RSS_FEEDS,
  fetchFeedArticles,
  selectArticles,
  type ParsedArticle,
} from '../_shared/rss.ts';

const KEEP_ARTICLE_COUNT = 50;
const DISPLAY_CANDIDATE_COUNT = 50;

interface SyncReport {
  ok: boolean;
  feeds: number;
  fetched: number;
  stored: number;
  durationMs: number;
  error?: string;
}

async function sync(): Promise<SyncReport> {
  const start = Date.now();
  const env = Deno.env.toObject();

  const supabase = createClient(
    env.SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const batches = await Promise.allSettled([
    ...RSS_FEEDS.map((feed) => fetchFeedArticles(feed)),
    fetchFotbollskanalenArticles(),
  ]);
  const articles: ParsedArticle[] = [];
  const errors: string[] = [];

  for (const result of batches) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    } else {
      errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
    }
  }

  if (articles.length === 0) {
    throw new Error(errors.join(' | ') || 'No RSS articles fetched');
  }

  const selected = selectArticles(articles, DISPLAY_CANDIDATE_COUNT);
  const rows = selected.map((a) => ({
    id: a.id,
    title: a.title,
    summary: a.summary,
    url: a.url,
    source: a.source,
    image_url: a.imageUrl,
    published_at: a.publishedAt,
    synced_at: new Date().toISOString(),
  }));

  const { error: deleteLegacyError } = await supabase
    .from('news_articles')
    .delete()
    .in('source', ['DN', 'SVT']);
  if (deleteLegacyError) throw new Error(`news_articles legacy cleanup: ${deleteLegacyError.message}`);

  const { error } = await supabase
    .from('news_articles')
    .upsert(rows, { onConflict: 'url' });
  if (error) throw new Error(`news_articles upsert: ${error.message}`);

  // Trim stale rows so the table stays small.
  const { data: stale, error: staleError } = await supabase
    .from('news_articles')
    .select('id')
    .order('published_at', { ascending: false })
    .range(KEEP_ARTICLE_COUNT, KEEP_ARTICLE_COUNT + 100);
  if (staleError) throw new Error(`news_articles trim select: ${staleError.message}`);

  if (stale && stale.length > 0) {
    const ids = stale.map((r) => r.id);
    const { error: deleteError } = await supabase
      .from('news_articles')
      .delete()
      .in('id', ids);
    if (deleteError) throw new Error(`news_articles trim delete: ${deleteError.message}`);
  }

  return {
    ok: true,
    feeds: RSS_FEEDS.length + 1,
    fetched: articles.length,
    stored: rows.length,
    durationMs: Date.now() - start,
    ...(errors.length > 0 ? { error: errors.join(' | ') } : {}),
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }
  try {
    const report = await sync();
    return new Response(JSON.stringify(report, null, 2), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sync-news] failed:', message);
    return new Response(
      JSON.stringify({ ok: false, error: message }, null, 2),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
});
