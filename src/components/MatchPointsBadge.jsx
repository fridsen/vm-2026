import clsx from 'clsx';
import {
  formatMatchPointsLabel,
  formatMatchPointsPartsLabel,
  matchPointsBadgeColors,
  matchPointsPartsTotal,
} from '../utils/matchPointsBadge.js';

export default function MatchPointsBadge({
  points,
  pointsParts,
  className,
  empty = false,
}) {
  const parts =
    pointsParts?.length > 1
      ? pointsParts
      : pointsParts?.length === 1
        ? pointsParts
        : points != null
          ? [points]
          : null;

  if (empty && parts == null) {
    return <span className={clsx('match-points-badge is-empty', className)} aria-hidden />;
  }
  if (parts == null) return null;

  const isCompound = parts.length > 1;
  const total = isCompound ? matchPointsPartsTotal(parts) : parts[0];
  const colors = matchPointsBadgeColors(total);
  const label = isCompound ? formatMatchPointsPartsLabel(parts) : formatMatchPointsLabel(parts[0]);

  return (
    <span
      className={clsx('match-points-badge', isCompound && 'match-points-badge--wide', className)}
      style={{ '--mpb-bg': colors.bg, '--mpb-text': colors.text }}
    >
      {label}
    </span>
  );
}
