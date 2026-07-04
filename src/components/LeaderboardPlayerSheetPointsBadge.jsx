import clsx from 'clsx';
import { formatMatchPointsLabel } from '../utils/matchPointsBadge.js';
import {
  groupRowPointsBadgeColors,
  groupTotalPointsBadgeColors,
} from '../utils/groupPointsBadge.js';

export default function LeaderboardPlayerSheetPointsBadge({
  points,
  variant = 'row',
  finalized,
}) {
  const value = Math.max(0, Math.round(Number(points) || 0));
  const colors =
    variant === 'total'
      ? groupTotalPointsBadgeColors(value, finalized)
      : groupRowPointsBadgeColors(value, finalized);

  return (
    <span
      className={clsx('lb-sheet-points-badge', variant === 'total' && 'is-total')}
      style={{ '--mpb-bg': colors.bg, '--mpb-text': colors.text }}
    >
      {formatMatchPointsLabel(value)}
    </span>
  );
}
