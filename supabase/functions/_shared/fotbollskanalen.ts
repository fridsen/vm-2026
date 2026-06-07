// Fotbollskanalen no longer exposes a public RSS feed (legacy URLs return 404).
// Scrape the /senaste listing page instead — article cards are server-rendered.

import { articleId, scoreRelevance, type ParsedArticle } from './rss.ts';

const BASE_URL = 'https://www.fotbollskanalen.se';
const LIST_URL = `${BASE_URL}/senaste`;
const SOURCE = 'Fotbollskanalen';

const EXCLUDED_PATH_PREFIXES = ['/artiklar/villkor/'];

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function normalizeImageUrl(src: string): string {
  return decodeHtmlEntities(src);
}

/** Map HH:MM from listing cards to a real UTC instant in Europe/Stockholm. */
export function stockholmIsoFromClock(
  hours: number,
  minutes: number,
  ref = new Date(),
): string {
  const dateParts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(ref);
  const y = Number(dateParts.find((p) => p.type === 'year')!.value);
  const mo = Number(dateParts.find((p) => p.type === 'month')!.value);
  const d = Number(dateParts.find((p) => p.type === 'day')!.value);

  for (const offsetHours of [1, 2]) {
    const candidate = new Date(Date.UTC(y, mo - 1, d, hours - offsetHours, minutes, 0));
    const parts = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Stockholm',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(candidate);
    const h = Number(parts.find((p) => p.type === 'hour')!.value);
    const m = Number(parts.find((p) => p.type === 'minute')!.value);
    if (h === hours && m === minutes) return candidate.toISOString();
  }

  return new Date(Date.UTC(y, mo - 1, d, hours - 2, minutes, 0)).toISOString();
}

function parseCardPublishedAt(block: string, ref = new Date()): string {
  const timeMatch = block.match(/>(\d{1,2}:\d{2})</);
  if (!timeMatch) return ref.toISOString();

  const [hours, minutes] = timeMatch[1].split(':').map(Number);
  let iso = stockholmIsoFromClock(hours, minutes, ref);
  if (new Date(iso).getTime() > ref.getTime() + 5 * 60_000) {
    const yesterday = new Date(ref.getTime() - 24 * 60 * 60 * 1000);
    iso = stockholmIsoFromClock(hours, minutes, yesterday);
  }
  return iso;
}

export function parseFotbollskanalenHtml(html: string): Omit<ParsedArticle, 'id'>[] {
  const cardRegex = /<a href="(\/(?:artiklar|kronikor|bloggar)\/[^"]+)">([\s\S]*?)<\/a>/gi;
  const articles: Omit<ParsedArticle, 'id'>[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  const ref = new Date();

  while ((match = cardRegex.exec(html)) !== null) {
    const path = match[1];
    if (EXCLUDED_PATH_PREFIXES.some((p) => path.startsWith(p))) continue;

    const block = match[2];
    const titleMatch = block.match(/<h3[^>]*>([^<]+)</i);
    if (!titleMatch) continue;

    const title = decodeHtmlEntities(titleMatch[1].trim());
    const imgMatch = block.match(/<img[^>]+src="([^"]+)"/i);
    const imageUrl = imgMatch ? normalizeImageUrl(imgMatch[1]) : null;
    const url = `${BASE_URL}${path}`;

    if (seen.has(url)) continue;
    seen.add(url);

    articles.push({
      title,
      summary: null,
      url,
      source: SOURCE,
      imageUrl,
      publishedAt: parseCardPublishedAt(block, ref),
      relevance: scoreRelevance(title, '', url),
    });
  }

  return articles;
}

export async function fetchFotbollskanalenArticles(): Promise<ParsedArticle[]> {
  const res = await fetch(LIST_URL, {
    headers: {
      'User-Agent': 'VM-tipset-2026/1.0 (news sync; +https://github.com)',
      Accept: 'text/html',
    },
  });
  if (!res.ok) {
    throw new Error(`Fotbollskanalen ${res.status}: ${LIST_URL}`);
  }

  const html = await res.text();
  const parsed = parseFotbollskanalenHtml(html);
  if (parsed.length === 0) {
    throw new Error(`Fotbollskanalen: no articles parsed from ${LIST_URL}`);
  }

  const withIds: ParsedArticle[] = [];
  for (const article of parsed) {
    withIds.push({ ...article, id: await articleId(article.url) });
  }

  return withIds;
}
