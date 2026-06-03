export const A2HS_PROMPT_DISMISSED_KEY = 'vm-a2hs-prompt-dismissed';
export const A2HS_SNOOZE_SESSION_KEY = 'vm-a2hs-snooze-session';

/** @typedef {'safari' | 'chrome'} IosInstallBrowser */

/**
 * True for iPhone/iPad/iPod (incl. iPadOS desktop UA).
 */
export function isIosDevice(userAgent = navigator.userAgent, platform = navigator.platform) {
  if (/iPad|iPhone|iPod/i.test(userAgent)) return true;
  return platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

/**
 * App opened from home screen (PWA / Add to Home Screen).
 */
export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // Legacy iOS Safari
  return Boolean(window.navigator.standalone);
}

/**
 * Which iOS browser flow to show. Chrome on iOS uses CriOS in UA.
 * Other iOS browsers (Firefox, Edge, in-app) fall back to Safari-style share steps.
 *
 * @returns {IosInstallBrowser | null}
 */
export function getIosInstallBrowser(userAgent = navigator.userAgent) {
  if (!isIosDevice(userAgent)) return null;
  if (/CriOS/i.test(userAgent)) return 'chrome';
  return 'safari';
}

export function shouldOfferAddToHomeScreen({
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '',
  platform = typeof navigator !== 'undefined' ? navigator.platform : '',
  standalone = isStandaloneDisplay(),
  dismissed = false,
} = {}) {
  if (standalone || dismissed) return false;
  if (!isIosDevice(userAgent, platform)) return false;
  return getIosInstallBrowser(userAgent) !== null;
}

export function readA2hsPromptDismissed() {
  if (typeof window === 'undefined') return false;
  return window.localStorage?.getItem(A2HS_PROMPT_DISMISSED_KEY) === '1';
}

export function writeA2hsPromptDismissed() {
  window.localStorage?.setItem(A2HS_PROMPT_DISMISSED_KEY, '1');
}

export function readA2hsSnoozedSession() {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage?.getItem(A2HS_SNOOZE_SESSION_KEY) === '1';
}

export function writeA2hsSnoozedSession() {
  window.sessionStorage?.setItem(A2HS_SNOOZE_SESSION_KEY, '1');
}
