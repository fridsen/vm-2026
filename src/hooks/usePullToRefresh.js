import { useCallback, useEffect, useRef, useState } from 'react';
import { isStandaloneDisplay } from '../utils/iosInstall.js';
import {
  canStartPull,
  dampedPullDistance,
  shouldTriggerRefresh,
  touchBlocksPull,
} from '../utils/pullToRefresh.js';

const MOBILE_MQ = '(max-width: 767px)';

/**
 * Custom pull-to-refresh for pinned / standalone PWAs where the browser
 * does not provide native PTR (iOS Add to Home Screen, etc.).
 */
export function usePullToRefresh({
  onRefresh,
  enabled = true,
  scrollRootRef = null,
} = {}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullDistanceRef = useRef(0);
  const trackingRef = useRef(false);
  const startYRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  onRefreshRef.current = onRefresh;
  refreshingRef.current = refreshing;

  const getScrollTop = useCallback(() => {
    const root = scrollRootRef?.current;
    if (root) return root.scrollTop;
    return window.scrollY || document.documentElement.scrollTop || 0;
  }, [scrollRootRef]);

  const resetPull = useCallback(() => {
    pullDistanceRef.current = 0;
    setPullDistance(0);
    document.documentElement.classList.remove('ptr-pulling', 'ptr-releasing');
    document.documentElement.style.removeProperty('--ptr-pull');
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const mq = window.matchMedia(MOBILE_MQ);
    const standalone = isStandaloneDisplay();

    let active = false;

    const setDistance = (distance) => {
      pullDistanceRef.current = distance;
      setPullDistance(distance);
      if (distance > 0) {
        document.documentElement.classList.add('ptr-pulling');
        document.documentElement.style.setProperty('--ptr-pull', `${distance}px`);
      } else {
        document.documentElement.classList.remove('ptr-pulling');
        document.documentElement.style.removeProperty('--ptr-pull');
      }
    };

    const onTouchStart = (event) => {
      if (!active || refreshingRef.current) return;
      const sheetOpen = document.documentElement.classList.contains('bottom-sheet-open');
      if (
        !canStartPull({
          scrollTop: getScrollTop(),
          sheetOpen,
          standalone,
          enabled: true,
        })
      ) {
        return;
      }
      if (touchBlocksPull(event.target, scrollRootRef?.current ?? document.body)) {
        return;
      }

      trackingRef.current = true;
      startYRef.current = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event) => {
      if (!trackingRef.current || refreshingRef.current) return;

      const y = event.touches[0]?.clientY ?? 0;
      const delta = y - startYRef.current;

      if (getScrollTop() > 0 || delta <= 0) {
        setDistance(0);
        return;
      }

      event.preventDefault();
      setDistance(dampedPullDistance(delta));
    };

    const finishPull = async () => {
      if (!trackingRef.current) return;
      trackingRef.current = false;

      const distance = pullDistanceRef.current;
      if (!shouldTriggerRefresh(distance) || refreshingRef.current) {
        document.documentElement.classList.add('ptr-releasing');
        setDistance(0);
        window.setTimeout(() => {
          document.documentElement.classList.remove('ptr-releasing');
        }, 220);
        return;
      }

      setRefreshing(true);
      refreshingRef.current = true;
      setDistance(48);
      try {
        await onRefreshRef.current?.();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        document.documentElement.classList.add('ptr-releasing');
        setDistance(0);
        window.setTimeout(() => {
          document.documentElement.classList.remove('ptr-releasing');
        }, 220);
      }
    };

    const bind = () => {
      active = mq.matches && standalone;
      if (!active) return;

      document.addEventListener('touchstart', onTouchStart, { passive: true });
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', finishPull);
      document.addEventListener('touchcancel', finishPull);
    };

    const unbind = () => {
      active = false;
      trackingRef.current = false;
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', finishPull);
      document.removeEventListener('touchcancel', finishPull);
      resetPull();
    };

    const onMqChange = () => {
      unbind();
      bind();
    };

    bind();
    mq.addEventListener('change', onMqChange);

    return () => {
      mq.removeEventListener('change', onMqChange);
      unbind();
    };
  }, [enabled, getScrollTop, resetPull, scrollRootRef]);

  return {
    pullDistance,
    refreshing,
    active: isStandaloneDisplay() && enabled,
  };
}
