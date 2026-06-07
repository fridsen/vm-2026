import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { isTabNavRoute, tabRouteIndex } from '../constants/navTabs.js';
import AppTabHeader from './AppTabHeader.jsx';

export default function AnimatedTabOutlet() {
  const { pathname } = useLocation();
  const prevPathRef = useRef(pathname);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const prev = prevPathRef.current;
    if (prev === pathname) return;

    const prevIdx = tabRouteIndex(prev);
    const nextIdx = tabRouteIndex(pathname);
    if (prevIdx >= 0 && nextIdx >= 0 && isTabNavRoute(prev) && isTabNavRoute(pathname)) {
      setSlide(nextIdx > prevIdx ? 1 : nextIdx < prevIdx ? -1 : 0);
    } else {
      setSlide(0);
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  const panelClass = clsx(
    'tab-slide-panel',
    slide === 1 && 'tab-slide-panel--from-right',
    slide === -1 && 'tab-slide-panel--from-left',
  );

  const isTab = isTabNavRoute(pathname);

  return (
    <div className="tab-slide-viewport">
      {isTab ? (
        <div className="app-tab-shell">
          <AppTabHeader />
          <div key={pathname} className={panelClass}>
            <Outlet />
          </div>
        </div>
      ) : (
        <div key={pathname} className={panelClass}>
          <Outlet />
        </div>
      )}
    </div>
  );
}
