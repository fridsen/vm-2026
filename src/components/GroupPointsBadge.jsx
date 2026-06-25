import clsx from 'clsx';
import { formatGroupPointsLabel, groupPointsBadgeColors } from '../utils/groupPointsBadge.js';

export default function GroupPointsBadge({ group, points, className, empty = false }) {
  if (empty && (group == null || points == null)) {
    return <span className={clsx('match-points-badge group-points-badge is-empty', className)} aria-hidden />;
  }
  if (group == null || points == null) return null;

  const colors = groupPointsBadgeColors(points);

  return (
    <span
      className={clsx('match-points-badge group-points-badge', className)}
      style={{ '--mpb-bg': colors.bg, '--mpb-text': colors.text }}
    >
      <span className="group-points-badge__letter">{group}:</span>
      {` ${Math.max(0, Math.round(Number(points) || 0))} pts`}
    </span>
  );
}
