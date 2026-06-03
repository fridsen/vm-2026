import { useEffect } from 'react';

const MOBILE_MQ = '(max-width: 767px)';

/**
 * iOS Safari: layout-viewport height exceeds the visual viewport when browser
 * chrome shows/hides. Pin the tab bar to the visual bottom and clamp document
 * scroll so you cannot scroll into empty space below the content.
 */
export function useVisualViewportFooter(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const mq = window.matchMedia(MOBILE_MQ);
    let chrome = null;
    let ro = null;
    let raf = 0;

    const clampScroll = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - vv.height - vv.offsetTop,
      );
      if (window.scrollY > maxScroll + 1) {
        window.scrollTo({ top: maxScroll, left: 0, behavior: 'auto' });
      }
    };

    const apply = () => {
      const vv = window.visualViewport;
      if (!chrome || !vv) return;

      const bottom = Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
      chrome.style.top = 'auto';
      chrome.style.bottom = `${bottom}px`;
      chrome.style.transform = 'none';

      clampScroll();
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
      window.addEventListener('scroll', schedule, { passive: true });
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
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
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
