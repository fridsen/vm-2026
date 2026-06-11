import { forwardRef } from 'react';
import clsx from 'clsx';
import LeaderboardRowFace from './LeaderboardRowFace.jsx';

function rankRowClass(rank) {
  if (rank < 1 || rank > 5) return null;
  return [`is-top-five`, `is-rank-${rank}`];
}

const LeaderboardRow = forwardRef(function LeaderboardRow(
  { rank, name, points, movement, onPress, className },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx('lb-row stagger-child', rankRowClass(rank), className)}
      onClick={onPress}
      aria-label={`Visa ${name}s tippningar idag`}
    >
      <LeaderboardRowFace
        rank={rank}
        name={name}
        points={points}
        movement={movement}
      />
    </button>
  );
});

export default LeaderboardRow;
