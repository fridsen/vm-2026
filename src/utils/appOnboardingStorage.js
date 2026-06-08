export const APP_ONBOARDING_SEEN_KEY = 'vm2026:appOnboardingSeen:v1';

export function appOnboardingStorageKey(userId) {
  return userId ? `${APP_ONBOARDING_SEEN_KEY}:${userId}` : APP_ONBOARDING_SEEN_KEY;
}

export function readLocalAppOnboardingSeen(userId) {
  if (!userId) return false;
  try {
    return window.localStorage?.getItem(appOnboardingStorageKey(userId)) === '1';
  } catch {
    return false;
  }
}

export function writeLocalAppOnboardingSeen(userId) {
  if (!userId) return;
  try {
    window.localStorage?.setItem(appOnboardingStorageKey(userId), '1');
  } catch {
    /* ignore unavailable storage */
  }
}
