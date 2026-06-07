import { describe, expect, it } from 'vitest';
import { buildSwishPayUrl, formatSwishDisplay, normalizeSwishNumber } from './swish.js';

describe('formatSwishDisplay', () => {
  it('formats 10-digit Swedish mobile numbers', () => {
    expect(formatSwishDisplay('0708312041')).toBe('070 831 20 41');
  });

  it('returns empty string when number is missing', () => {
    expect(formatSwishDisplay('')).toBe('');
    expect(formatSwishDisplay()).toBe('');
  });
});

describe('normalizeSwishNumber', () => {
  it('converts 07 numbers to 46', () => {
    expect(normalizeSwishNumber('070-123 45 67')).toBe('46701234567');
  });
});

describe('buildSwishPayUrl', () => {
  it('builds app.swish.nu link with amount and message', () => {
    const url = buildSwishPayUrl({
      phone: '0701234567',
      amountSek: 200,
      message: 'VM-tipset',
    });
    expect(url).toMatch(/^https:\/\/app\.swish\.nu\/1\/p\/sw\/\?/);
    expect(url).toContain('sw=46701234567');
    expect(url).toContain('amt=200');
    expect(url).toContain('cur=SEK');
    expect(url).toContain('msg=VM-tipset');
  });

  it('returns null without phone', () => {
    expect(buildSwishPayUrl({ phone: '' })).toBeNull();
  });
});
