/** Main tab bar routes in visual order (left → right). */
export const TAB_NAV_ROUTES = ['/', '/mina-tips', '/matcher', '/grupper', '/leaderboard'];

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
