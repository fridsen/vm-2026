import clsx from 'clsx';
import { PTR_THRESHOLD_PX } from '../utils/pullToRefresh.js';

export default function PullToRefreshIndicator({ pullDistance = 0, refreshing = false, active = false }) {
  if (!active) return null;

  const progress = Math.min(1, pullDistance / PTR_THRESHOLD_PX);
  const visible = refreshing || pullDistance > 4;

  return (
    <div
      className={clsx(
        'ptr-indicator',
        visible && 'ptr-indicator--visible',
        refreshing && 'ptr-indicator--refreshing',
      )}
      aria-hidden={!visible}
    >
      <div
        className="ptr-indicator__spinner"
        style={{ '--ptr-progress': progress }}
      />
      <span className="ptr-indicator__label">
        {refreshing ? 'Uppdaterar…' : progress >= 1 ? 'Släpp för att uppdatera' : 'Dra för att uppdatera'}
      </span>
    </div>
  );
}
