import clsx from 'clsx';
import { formatMatchPointsLabel, matchPointsBadgeColors } from '../utils/matchPointsBadge.js';

export default function MatchPointsBadge({ points, className, empty = false }) {
  if (empty && points == null) {
    return <span className={clsx('match-points-badge is-empty', className)} aria-hidden />;
  }
  if (points == null) return null;

  const colors = matchPointsBadgeColors(points);

  return (
    <span
      className={clsx('match-points-badge', className)}
      style={{ '--mpb-bg': colors.bg, '--mpb-text': colors.text }}
    >
      {formatMatchPointsLabel(points)}
    </span>
  );
}
