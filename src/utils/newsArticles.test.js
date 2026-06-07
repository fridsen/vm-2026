import { describe, expect, it } from 'vitest';
import { parseFotbollskanalenHtml } from '../../supabase/functions/_shared/fotbollskanalen.ts';
import {
  extractImageUrl,
  parseRssXml,
  scoreRelevance,
  selectArticles,
  stripHtml,
} from '../../supabase/functions/_shared/rss.ts';

describe('rss relevance', () => {
  it('prioritises VM headlines over generic sport', () => {
    const vmScore = scoreRelevance(
      'Grönt ljus för Iran – har fått visum till USA',
      'Det iranska landslaget har fått visum inför fotbolls-VM.',
      'https://www.expressen.se/sport/fotboll/gront-ljus/',
    );
    const golfScore = scoreRelevance(
      'Mardrömsdag för Ludvig Åberg',
      'Svensken hade en riktig katastrofdag.',
      'https://www.expressen.se/sport/golf/mardromsdag/',
    );

    expect(vmScore).toBeGreaterThan(golfScore);
  });

  it('balances picks across sources', () => {
    const picked = selectArticles(
      [
        {
          id: '1',
          title: 'DN VM 1',
          summary: null,
          url: 'https://dn.se/1',
          source: 'DN',
          imageUrl: null,
          publishedAt: '2026-06-05T12:00:00.000Z',
          relevance: 20,
        },
        {
          id: '2',
          title: 'DN VM 2',
          summary: null,
          url: 'https://dn.se/2',
          source: 'DN',
          imageUrl: null,
          publishedAt: '2026-06-05T11:00:00.000Z',
          relevance: 20,
        },
        {
          id: '3',
          title: 'AB VM',
          summary: null,
          url: 'https://ab.se/1',
          source: 'Aftonbladet',
          imageUrl: null,
          publishedAt: '2026-06-05T10:00:00.000Z',
          relevance: 15,
        },
        {
          id: '4',
          title: 'FK VM',
          summary: null,
          url: 'https://fk.se/1',
          source: 'Fotbollskanalen',
          imageUrl: null,
          publishedAt: '2026-06-05T09:00:00.000Z',
          relevance: 15,
        },
      ],
      3,
    );

    expect(picked.map((a) => a.source).sort()).toEqual(
      ['Aftonbladet', 'DN', 'Fotbollskanalen'].sort(),
    );
  });
});

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hej&nbsp;<strong>VM</strong></p>')).toBe('Hej VM');
  });
});

describe('extractImageUrl', () => {
  it('reads media:content urls from DN-style RSS items', () => {
    const block = `
      <description>Plain text summary.</description>
      <media:content type="image/jpeg" url="https://static.bonniernews.se/ba/example.jpeg?io=1&amp;width=1000" />
    `;
    expect(extractImageUrl(block, '')).toBe(
      'https://static.bonniernews.se/ba/example.jpeg?io=1&width=1000',
    );
  });

  it('prefers img tags in HTML descriptions', () => {
    const block = '<description><![CDATA[<img src=\'https://cdn.example/a.jpg\'/><p>Text</p>]]></description>';
    const desc = "<img src='https://cdn.example/a.jpg'/><p>Text</p>";
    expect(extractImageUrl(block, desc)).toBe('https://cdn.example/a.jpg');
  });
});

describe('parseFotbollskanalenHtml', () => {
  it('extracts article cards from the senaste listing', () => {
    const html = `
      <a href="/artiklar/vm-2026/bekraftat-karl-skadad---uppges-riskera-att-missa-vm">
        <div class="flex gap-1">
          <img src="https://cdn.example.com/karl.jpg" alt="" />
          <h3 class="font-bold">Bekräftat: Karl skadad - uppges riskera att missa VM</h3>
        </div>
      </a>
      <a href="/artiklar/villkor/cookiepolicy"><h3>Info om cookies</h3></a>
    `;
    const articles = parseFotbollskanalenHtml(html);

    expect(articles).toHaveLength(1);
    expect(articles[0].source).toBe('Fotbollskanalen');
    expect(articles[0].title).toContain('Karl skadad');
    expect(articles[0].url).toContain('/artiklar/vm-2026/');
    expect(articles[0].imageUrl).toBe('https://cdn.example.com/karl.jpg');
    expect(articles[0].relevance).toBeGreaterThan(0);
  });
});

describe('parseRssXml summaries', () => {
  it('strips HTML from expressen-style CDATA descriptions', () => {
    const xml = `<?xml version="1.0"?><rss><channel><item>
      <title>VM-test</title>
      <link>https://example.com/a</link>
      <description><![CDATA[<img src='https://cdn.example/a.jpg'/><p>Brödtext här.</p>]]></description>
      <pubDate>Fri, 05 Jun 2026 12:00:00 +0200</pubDate>
    </item></channel></rss>`;
    const [article] = parseRssXml(xml, 'Expressen');
    expect(article.summary).toBe('Brödtext här.');
    expect(article.imageUrl).toBe('https://cdn.example/a.jpg');
  });
});
