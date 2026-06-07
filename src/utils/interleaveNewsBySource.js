/** Mix sources in the feed so one publisher cannot dominate the list order. */
export function interleaveNewsBySource(articles) {
  if (articles.length <= 1) return articles;

  const bySource = new Map();
  for (const article of articles) {
    const list = bySource.get(article.source) ?? [];
    list.push(article);
    bySource.set(article.source, list);
  }

  for (const list of bySource.values()) {
    list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }

  const sources = [...bySource.keys()].sort();
  const mixed = [];
  let round = 0;

  while (mixed.length < articles.length) {
    let added = false;
    for (const source of sources) {
      const article = bySource.get(source)[round];
      if (!article) continue;
      mixed.push(article);
      added = true;
    }
    if (!added) break;
    round += 1;
  }

  return mixed;
}
