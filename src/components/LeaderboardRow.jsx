import { forwardRef } from 'react';
import clsx from 'clsx';
import LeaderboardRowFace from './LeaderboardRowFace.jsx';

const LeaderboardRow = forwardRef(function LeaderboardRow(
  { rank, name, points, movement, onPress, className },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={clsx('lb-row stagger-child', className)}
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
