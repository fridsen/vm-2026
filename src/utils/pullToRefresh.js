export const PTR_THRESHOLD_PX = 64;
export const PTR_MAX_PULL_PX = 96;
export const PTR_DAMPING = 0.45;

export function dampedPullDistance(deltaY) {
  if (deltaY <= 0) return 0;
  return Math.min(deltaY * PTR_DAMPING, PTR_MAX_PULL_PX);
}

export function canStartPull({
  scrollTop = 0,
  sheetOpen = false,
  standalone = false,
  enabled = true,
} = {}) {
  if (!enabled || !standalone) return false;
  if (sheetOpen) return false;
  return scrollTop <= 0;
}

export function shouldTriggerRefresh(pullDistance) {
  return pullDistance >= PTR_THRESHOLD_PX;
}

/** True when touch began inside a nested scroller that is not at the top. */
export function touchBlocksPull(target, root = document.body) {
  if (!(target instanceof Element)) return false;

  let el = target;
  while (el && el !== root) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const scrollable =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      el.scrollHeight > el.clientHeight + 1;
    if (scrollable && el.scrollTop > 0) return true;
    el = el.parentElement;
  }
  return false;
}
