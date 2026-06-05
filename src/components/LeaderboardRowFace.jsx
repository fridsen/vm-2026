import clsx from 'clsx';

export function RankBadge({ rank }) {
  const tier =
    rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default';

  return (
    <div className={clsx('lb-rank', `is-${tier}`)} aria-hidden>
      {rank}
    </div>
  );
}

export function MovementBadge({ delta }) {
  if (!delta) return null;
  const up = delta > 0;
  return (
    <div className={clsx('lb-movement', up ? 'is-up' : 'is-down')}>
      <span>{Math.abs(delta)}</span>
      <svg viewBox="0 0 14 14" aria-hidden className={clsx(!up && 'is-flip')}>
        <path d="M7 3.5 11.5 9.5H2.5L7 3.5Z" fill="currentColor" />
      </svg>
    </div>
  );
}

export default function LeaderboardRowFace({
  rank,
  name,
  points,
  movement,
  showMovement = true,
  variant = 'list',
  nameId,
}) {
  return (
    <>
      <div className="lb-row-left">
        <RankBadge rank={rank} />
        <span className="lb-name" id={nameId}>
          {name}
        </span>
      </div>
      <div className="lb-row-right">
        {showMovement && <MovementBadge delta={movement} />}
        <span className={clsx('lb-points', variant === 'overlay' && 'is-overlay')}>
          {points}
        </span>
      </div>
    </>
  );
}
