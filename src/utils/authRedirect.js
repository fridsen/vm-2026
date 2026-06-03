/**
 * Where Supabase should send the user after OAuth / magic link / password reset.
 * Uses the current origin in the browser; override with VITE_SITE_URL when testing
 * on a phone via LAN IP (e.g. http://192.168.1.10:5173).
 */
export function getAuthRedirectUrl() {
  const fromEnv = import.meta.env?.VITE_SITE_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
