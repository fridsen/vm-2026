/** Main tab bar routes in visual order (left → right). */
export const TAB_NAV_ROUTES = ['/', '/mina-tips', '/matcher', '/grupper', '/leaderboard'];

export const TAB_HEADER_META = {
  '/mina-tips': {
    title: 'Dina Tips',
    subtitle: 'Alla dina tips samlade på ett ställe',
  },
  '/matcher': {
    title: 'Matcher',
    subtitle: 'Alla matcher i svensk tid',
  },
  '/grupper': {
    title: 'Tabeller',
    subtitle: 'Grupper och slutspel',
  },
  '/leaderboard': {
    title: 'Leaderboard',
    subtitle: 'Vem vinner VM-tipset 2026',
  },
};

export function getTabHeaderMeta(pathname) {
  const route = TAB_NAV_ROUTES.find(
    (tabRoute) =>
      tabRoute !== '/' && (pathname === tabRoute || pathname.startsWith(`${tabRoute}/`)),
  );
  return route ? TAB_HEADER_META[route] : null;
}

export function tabRouteIndex(pathname) {
  if (pathname === '/') return 0;
  const idx = TAB_NAV_ROUTES.findIndex(
    (route) => route !== '/' && (pathname === route || pathname.startsWith(`${route}/`)),
  );
  return idx;
}

export function isTabNavRoute(pathname) {
  return tabRouteIndex(pathname) >= 0;
}
