// RSS fetch + parse helpers for sync-news.
// Regex-based parser — DOMParser is not available in Supabase Edge Functions.

export interface RssFeedConfig {
  url: string;
  source: string;
}

export interface ParsedArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source: string;
  imageUrl: string | null;
  publishedAt: string;
  relevance: number;
}

export const RSS_FEEDS: RssFeedConfig[] = [
  { url: 'https://feeds.expressen.se/sport/', source: 'Expressen' },
  { url: 'https://rss.aftonbladet.se/rss2/small/pages/sections/sportbladet/', source: 'Aftonbladet' },
  { url: 'https://www.svt.se/sport/rss.xml', source: 'SVT Sport' },
];

const VM_KEYWORDS = [
  'vm 2026',
  'vm-2026',
  'fotbolls-vm',
  'fotbollsvm',
  'world cup',
  'world cup 2026',
  'fifa',
];

const FOOTBALL_HINTS = ['/fotboll/', '/sport/fotboll', '/sportbladet/fotboll', '/svt.se/sport/', 'fotboll'];

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function firstImageUrl(html: string): string | null {
  const match = html.match(/<img[^>]+src=['"]([^'"]+)['"]/i);
  return match?.[1] ?? null;
}

/** Pull image URL from common RSS extensions (Media RSS, enclosure, etc.). */
export function extractImageUrl(itemBlock: string, descriptionHtml: string): string | null {
  if (descriptionHtml) {
    const fromDesc = firstImageUrl(descriptionHtml);
    if (fromDesc) return decodeEntities(fromDesc);
  }

  const mediaContent = itemBlock.match(
    /<media:content[^>]+url=["']([^"']+)["']/i,
  );
  if (mediaContent) return decodeEntities(mediaContent[1]);

  const mediaThumb = itemBlock.match(
    /<media:thumbnail[^>]+url=["']([^"']+)["']/i,
  );
  if (mediaThumb) return decodeEntities(mediaThumb[1]);

  const enclosure = itemBlock.match(
    /<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\//i,
  );
  if (enclosure) return decodeEntities(enclosure[1]);

  return null;
}

export function scoreRelevance(title: string, summary: string, url: string): number {
  const haystack = `${title} ${summary} ${url}`.toLowerCase();
  let score = 0;

  for (const keyword of VM_KEYWORDS) {
    if (haystack.includes(keyword)) score += 10;
  }

  for (const hint of FOOTBALL_HINTS) {
    if (haystack.includes(hint)) score += 3;
  }

  if (/\bvm\b/.test(haystack)) score += 5;

  return score;
}

export async function articleId(url: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(url));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractTag(block: string, tag: string): string {
  const cdata = new RegExp(
    `<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`,
    'i',
  );
  const cdataMatch = block.match(cdata);
  if (cdataMatch) return decodeEntities(cdataMatch[1].trim());

  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const plainMatch = block.match(plain);
  if (!plainMatch) return '';
  return decodeEntities(stripHtml(plainMatch[1]).trim());
}

function parsePubDate(raw: string): string {
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return new Date().toISOString();
  return new Date(parsed).toISOString();
}

export function parseRssXml(xml: string, source: string): Omit<ParsedArticle, 'id'>[] {
  const articles: Omit<ParsedArticle, 'id'>[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, 'title');
    const url = extractTag(block, 'link') || extractTag(block, 'guid');
    if (!title || !url) continue;

    const rawDescription =
      extractTag(block, 'description') || extractTag(block, 'summary');
    const summaryText = rawDescription ? stripHtml(rawDescription) : '';
    const summary = summaryText ? summaryText.slice(0, 220) : null;
    const imageUrl = extractImageUrl(block, rawDescription);
    const publishedAt = parsePubDate(
      extractTag(block, 'pubDate') ||
        extractTag(block, 'published') ||
        extractTag(block, 'updated') ||
        new Date().toISOString(),
    );
    const relevance = scoreRelevance(title, summary ?? '', url);

    articles.push({
      title,
      summary,
      url,
      source,
      imageUrl,
      publishedAt,
      relevance,
    });
  }

  return articles;
}

export async function fetchFeedArticles(feed: RssFeedConfig): Promise<ParsedArticle[]> {
  const res = await fetch(feed.url, {
    headers: {
      'User-Agent': 'VM-tipset-2026/1.0 (news sync; +https://github.com)',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });
  if (!res.ok) {
    throw new Error(`${feed.source} RSS ${res.status}: ${feed.url}`);
  }

  const xml = await res.text();
  const parsed = parseRssXml(xml, feed.source);
  const withIds: ParsedArticle[] = [];

  for (const article of parsed) {
    withIds.push({ ...article, id: await articleId(article.url) });
  }

  return withIds;
}

export function selectArticles(
  articles: ParsedArticle[],
  limit = 5,
): ParsedArticle[] {
  const sorted = [...articles].sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    return b.publishedAt.localeCompare(a.publishedAt);
  });

  const relevant = sorted.filter((a) => a.relevance >= 3);
  const pool = relevant.length >= limit ? relevant : sorted;

  const bySource = new Map<string, ParsedArticle[]>();
  for (const article of pool) {
    const list = bySource.get(article.source) ?? [];
    list.push(article);
    bySource.set(article.source, list);
  }

  const sources = [...bySource.keys()].sort();
  const picked: ParsedArticle[] = [];
  const seen = new Set<string>();
  const maxPerSource = Math.max(3, Math.ceil(limit / Math.max(sources.length, 1)));

  while (picked.length < limit) {
    let addedThisRound = false;
    for (const source of sources) {
      const sourceCount = picked.filter((a) => a.source === source).length;
      if (sourceCount >= maxPerSource) continue;

      const list = bySource.get(source)!;
      const candidate = list.find((a) => !seen.has(a.url));
      if (!candidate) continue;
      seen.add(candidate.url);
      picked.push(candidate);
      addedThisRound = true;
      if (picked.length >= limit) break;
    }
    if (!addedThisRound) break;
  }

  return picked;
}
