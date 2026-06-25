import { forwardRef } from 'react';
import clsx from 'clsx';
import LeaderboardRowFace from './LeaderboardRowFace.jsx';

function rankRowClass(rank) {
  if (rank < 1 || rank > 5) return null;
  return [`is-top-five`, `is-rank-${rank}`];
}

const LeaderboardRow = forwardRef(function LeaderboardRow(
  {
    rank,
    name,
    points,
    matchPoints,
    groupPoints,
    latestPoints,
    latestPointsParts,
    latestGroup,
    latestGroupPoints,
    movement,
    showMovement,
    view,
    onPress,
    className,
  },
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
        matchPoints={matchPoints}
        groupPoints={groupPoints}
        latestPoints={latestPoints}
        latestPointsParts={latestPointsParts}
        latestGroup={latestGroup}
        latestGroupPoints={latestGroupPoints}
        movement={movement}
        showMovement={showMovement}
        view={view}
        variant="page"
      />
    </button>
  );
});

export default LeaderboardRow;
