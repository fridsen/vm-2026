import { useEffect } from 'react';

const MOBILE_MQ = '(max-width: 767px)';

function getBottomInset() {
  const vv = window.visualViewport;
  if (!vv) return 0;
  return Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
}

/**
 * iOS Safari: fixed `bottom: 0` sticks to the layout viewport, so when browser
 * chrome hides the tab bar floats above a white band. Pin to the visual viewport
 * bottom via `top`, and pad the chrome stack to cover the toolbar zone when visible.
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

      // Measure after inset padding is applied (chrome includes nav + filler pad).
      const chromeH = chrome.getBoundingClientRect().height;
      const top = Math.round(vv.offsetTop + vv.height - chromeH);
      chrome.style.top = `${top}px`;
      chrome.style.bottom = 'auto';
      chrome.style.left = '0';
      chrome.style.right = '0';
      chrome.style.width = '100%';
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
        chrome.style.removeProperty('left');
        chrome.style.removeProperty('right');
        chrome.style.removeProperty('width');
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
