const ENTRY_ASSET_RE = /\/assets\/index-[A-Za-z0-9_-]+\.js/;

/** Parse the Vite entry script path from a built index.html payload. */
export function parseEntryAssetFromHtml(html) {
  const match = html.match(ENTRY_ASSET_RE);
  return match?.[0] ?? null;
}

/** Entry script currently running in the page (production builds only). */
export function getLoadedEntryAsset(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return null;

  for (const el of doc.querySelectorAll('script[type="module"][src]')) {
    const src = el.getAttribute('src') || '';
    const matched = src.match(ENTRY_ASSET_RE);
    if (matched) return matched[0];

    if (el.src) {
      try {
        const path = new URL(el.src, window.location.origin).pathname;
        const fromUrl = path.match(ENTRY_ASSET_RE);
        if (fromUrl) return fromUrl[0];
      } catch {
        /* ignore malformed script URLs */
      }
    }
  }

  return null;
}

export async function fetchLatestEntryAsset(
  origin = typeof window !== 'undefined' ? window.location.origin : '',
) {
  const res = await fetch(`${origin}/?__version=${Date.now()}`, {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!res.ok) return null;
  return parseEntryAssetFromHtml(await res.text());
}

/** True when the deployed entry bundle differs from what this tab loaded. */
export async function hasRemoteAppUpdate({
  loadedAsset = getLoadedEntryAsset(),
  fetchLatest = fetchLatestEntryAsset,
} = {}) {
  if (!loadedAsset) return false;
  const latest = await fetchLatest();
  return Boolean(latest && latest !== loadedAsset);
}

/** Build a navigation URL that bypasses iOS standalone / bfcache HTML caching. */
export function buildHardReloadUrl(href = typeof window !== 'undefined' ? window.location.href : '') {
  const url = new URL(href);
  url.searchParams.set('__app_reload', String(Date.now()));
  return url.toString();
}

/**
 * Force-fetch a fresh index.html + entry bundle. Plain reload() is unreliable
 * in pinned iOS web apps and can leave the tab on a stale shell.
 */
export function performHardAppReload(href = typeof window !== 'undefined' ? window.location.href : '') {
  window.location.replace(buildHardReloadUrl(href));
}
