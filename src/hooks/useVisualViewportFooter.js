import { useEffect } from 'react';

const MOBILE_MQ = '(max-width: 767px)';

function getBottomInset() {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
}

/**
 * iOS Safari: the layout viewport extends below the visual viewport when browser
 * chrome is visible. Extend the tab bar stack to fill that gap and only clamp the
 * extra layout-only scroll range (not normal content scroll).
 */
export function useVisualViewportFooter(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const mq = window.matchMedia(MOBILE_MQ);
    let chrome = null;
    let ro = null;
    let raf = 0;

    const clampScroll = () => {
      const bottomInset = getBottomInset();
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight - bottomInset,
      );
      if (window.scrollY > maxScroll + 1) {
        window.scrollTo({ top: maxScroll, left: 0, behavior: 'auto' });
      }
    };

    const apply = () => {
      const vv = window.visualViewport;
      if (!chrome || !vv) return;

      const bottomInset = getBottomInset();
      document.documentElement.style.setProperty(
        '--app-visual-bottom-inset',
        `${bottomInset}px`,
      );

      chrome.style.top = 'auto';
      chrome.style.bottom = '0';
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
      document.documentElement.style.removeProperty('--app-visual-bottom-inset');
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
