import { describe, expect, it } from 'vitest';
import {
  getIosInstallBrowser,
  isIosDevice,
  shouldOfferAddToHomeScreen,
} from './iosInstall.js';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36';

describe('isIosDevice', () => {
  it('detects iPhone Safari', () => {
    expect(isIosDevice(IPHONE_SAFARI, 'iPhone')).toBe(true);
  });

  it('rejects Android Chrome', () => {
    expect(isIosDevice(ANDROID_CHROME, 'Linux armv8l')).toBe(false);
  });
});

describe('getIosInstallBrowser', () => {
  it('returns safari on iPhone Safari', () => {
    expect(getIosInstallBrowser(IPHONE_SAFARI)).toBe('safari');
  });

  it('returns chrome when CriOS is present', () => {
    expect(getIosInstallBrowser(IPHONE_CHROME)).toBe('chrome');
  });

  it('returns null off iOS', () => {
    expect(getIosInstallBrowser(ANDROID_CHROME)).toBe(null);
  });
});

describe('shouldOfferAddToHomeScreen', () => {
  it('offers on iOS when not standalone or dismissed', () => {
    expect(
      shouldOfferAddToHomeScreen({
        userAgent: IPHONE_SAFARI,
        platform: 'iPhone',
        standalone: false,
        dismissed: false,
        enabled: true,
      }),
    ).toBe(true);
  });

  it('hides when standalone or dismissed', () => {
    expect(
      shouldOfferAddToHomeScreen({
        userAgent: IPHONE_SAFARI,
        platform: 'iPhone',
        standalone: true,
        dismissed: false,
      }),
    ).toBe(false);
    expect(
      shouldOfferAddToHomeScreen({
        userAgent: IPHONE_CHROME,
        platform: 'iPhone',
        standalone: false,
        dismissed: true,
      }),
    ).toBe(false);
  });
});
