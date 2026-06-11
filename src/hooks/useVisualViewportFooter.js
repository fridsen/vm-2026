import { useEffect } from 'react';

const MOBILE_MQ = '(max-width: 767px)';

/**
 * iOS Safari: position:fixed uses the layout viewport; pin the tab bar stack to
 * the visual viewport bottom when browser chrome shows/hides (resize only).
 * Do not listen to visualViewport scroll — that fights pull-to-refresh rubber
 * banding and makes the bar slide up while content moves down (vmkollen .bnav
 * uses fixed bottom without scroll-driven repositioning).
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

      const height = chrome.offsetHeight;
      const top = Math.round(vv.offsetTop + vv.height - height);
      chrome.style.top = `${top}px`;
      chrome.style.bottom = 'auto';
      chrome.style.left = '0';
      chrome.style.right = '0';
      chrome.style.width = '100%';

      // Layout viewport can extend below the visual viewport when Safari hides UI.
      const layoutBottom = window.innerHeight;
      const visualBottom = vv.offsetTop + vv.height;
      const gap = Math.max(0, Math.round(layoutBottom - visualBottom));
      document.documentElement.style.setProperty('--vv-bottom-gap', `${gap}px`);
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
        chrome.style.removeProperty('left');
        chrome.style.removeProperty('right');
        chrome.style.removeProperty('width');
      }
      document.documentElement.style.removeProperty('--vv-bottom-gap');
      chrome = null;
      window.visualViewport?.removeEventListener('resize', schedule);
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
