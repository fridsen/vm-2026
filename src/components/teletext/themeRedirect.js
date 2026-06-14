import { TELETEXT_HOME_PAGE } from '../../teletext/constants.js';
import { THEMES } from '../../hooks/useTheme.js';

/** Pure redirect target for theme ↔ route sync. Returns null when no navigation needed. */
export function resolveThemeNavigation({ theme, pathname, themeChanged }) {
  const isTeletextRoute = pathname.startsWith('/t/');
  const teletextDashboard = `/t/${TELETEXT_HOME_PAGE}`;

  if (themeChanged) {
    if (theme === THEMES.TELETEXT) return teletextDashboard;
    if (theme === THEMES.DEFAULT) return '/';
  }

  if (theme === THEMES.TELETEXT && !isTeletextRoute) {
    return teletextDashboard;
  }

  if (theme === THEMES.DEFAULT && isTeletextRoute) {
    return '/';
  }

  return null;
}
