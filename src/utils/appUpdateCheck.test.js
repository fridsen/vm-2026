import { describe, expect, it, vi } from 'vitest';
import {
  buildHardReloadUrl,
  getLoadedEntryAsset,
  hasRemoteAppUpdate,
  parseEntryAssetFromHtml,
} from './appUpdateCheck.js';

describe('parseEntryAssetFromHtml', () => {
  it('extracts the Vite entry script path', () => {
    const html =
      '<script type="module" crossorigin src="/assets/index-deadbeef.js"></script>';
    expect(parseEntryAssetFromHtml(html)).toBe('/assets/index-deadbeef.js');
  });

  it('returns null when no entry script is present', () => {
    expect(parseEntryAssetFromHtml('<script src="/src/main.jsx"></script>')).toBe(null);
  });
});

describe('getLoadedEntryAsset', () => {
  it('reads the entry script from the current document', () => {
    const doc = {
      querySelectorAll: () => [
        { getAttribute: () => '/assets/index-abc123.js', src: '' },
      ],
    };
    expect(getLoadedEntryAsset(doc)).toBe('/assets/index-abc123.js');
  });
});

describe('buildHardReloadUrl', () => {
  it('adds a cache-busting query param', () => {
    const url = buildHardReloadUrl('https://example.com/matcher?tab=grupper');
    expect(url).toMatch(/^https:\/\/example\.com\/matcher\?tab=grupper&__app_reload=\d+$/);
  });
});

describe('hasRemoteAppUpdate', () => {
  it('detects when the deployed bundle changed', async () => {
    const fetchLatest = vi.fn(async () => '/assets/index-new.js');
    await expect(
      hasRemoteAppUpdate({
        loadedAsset: '/assets/index-old.js',
        fetchLatest,
      }),
    ).resolves.toBe(true);
  });

  it('returns false when bundles match', async () => {
    const fetchLatest = vi.fn(async () => '/assets/index-same.js');
    await expect(
      hasRemoteAppUpdate({
        loadedAsset: '/assets/index-same.js',
        fetchLatest,
      }),
    ).resolves.toBe(false);
  });

  it('returns false when no production bundle is loaded', async () => {
    await expect(
      hasRemoteAppUpdate({
        loadedAsset: null,
        fetchLatest: vi.fn(async () => '/assets/index-new.js'),
      }),
    ).resolves.toBe(false);
  });
});
