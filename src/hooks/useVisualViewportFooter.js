import { useEffect } from 'react';

const MOBILE_MQ = '(max-width: 767px)';
const TAB_BAR_HEIGHT_FALLBACK = 80;

/**
 * iOS Safari: pin bottom chrome to the visual viewport (not the layout bottom).
 * Uses top positioning so page scroll does not push the tab bar off-screen.
 */
export function useVisualViewportFooter(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const mq = window.matchMedia(MOBILE_MQ);
    let chrome = null;
    let ro = null;
    let raf = 0;

    const apply = () => {
      const vv = window.visualViewport;
      if (!chrome || !vv) return;

      const chromeH = Math.max(TAB_BAR_HEIGHT_FALLBACK, Math.ceil(chrome.offsetHeight));
      const top = Math.round(vv.offsetTop + vv.height - chromeH);
      chrome.style.top = `${top}px`;
      chrome.style.bottom = 'auto';
      chrome.style.transform = 'none';

      document.documentElement.style.setProperty('--app-tab-bar-total', `${chromeH}px`);
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    const bind = () => {
      chrome = document.querySelector('.app-mobile-chrome');
      if (!chrome || !window.visualViewport) return;

      apply();
      window.visualViewport.addEventListener('resize', schedule);
      window.visualViewport.addEventListener('scroll', schedule);
      window.addEventListener('resize', schedule);
      window.addEventListener('orientationchange', schedule);

      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(schedule);
        ro.observe(chrome);
      }
    };

    const unbind = () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      ro = null;
      if (chrome) {
        chrome.style.removeProperty('top');
        chrome.style.removeProperty('bottom');
        chrome.style.removeProperty('transform');
      }
      chrome = null;
      document.documentElement.style.removeProperty('--app-tab-bar-total');
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
    };

    const onMqChange = () => {
      unbind();
      if (mq.matches) bind();
    };

    if (mq.matches) bind();
    mq.addEventListener('change', onMqChange);

    return () => {
      mq.removeEventListener('change', onMqChange);
      unbind();
    };
  }, [enabled]);
}
