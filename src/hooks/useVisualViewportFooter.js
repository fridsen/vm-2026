import { useEffect } from 'react';

const MOBILE_MQ = '(max-width: 767px)';

/**
 * iOS Safari: position:fixed uses the layout viewport, but the visible area is
 * the visual viewport. Pin the tab bar to the visual bottom so it tracks when
 * the browser chrome shows/hides. Requires document scroll (not an inner shell).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport
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
      chrome.style.top = `${Math.round(vv.offsetTop + vv.height - height)}px`;
      chrome.style.bottom = 'auto';
      chrome.style.left = '0';
      chrome.style.right = '0';
      chrome.style.width = '100%';
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
        chrome.style.removeProperty('left');
        chrome.style.removeProperty('right');
        chrome.style.removeProperty('width');
      }
      chrome = null;
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
