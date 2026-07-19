import clsx from 'clsx';
import MatchPointsBadge from './MatchPointsBadge.jsx';
import GroupPointsBadge from './GroupPointsBadge.jsx';

function rankTier(rank) {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  if (rank === 4 || rank === 5) return 'podium';
  return 'default';
}

export function RankBadge({ rank, movement, className }) {
  const showMovement = movement != null && movement !== 0;

  return (
    <div className={clsx('lb-rank-wrap', className)}>
      <div
        className={clsx(
          'lb-rank',
          `is-${rankTier(rank)}`,
          rank <= 5 && 'is-top-rank',
        )}
        aria-hidden
      >
        {rank}
      </div>
      {showMovement ? (
        <span
          className={clsx('lb-rank-movement', movement > 0 ? 'is-up' : 'is-down')}
          aria-label={`Förflyttning ${movement > 0 ? 'upp' : 'ner'} ${Math.abs(movement)} platser`}
        >
          {movement > 0 ? `+${movement}` : movement}
        </span>
      ) : null}
    </div>
  );
}

function LatestMatchPointsBadge({ points, pointsParts }) {
  return (
    <MatchPointsBadge
      points={points}
      pointsParts={pointsParts}
      className="lb-latest-points"
      empty
    />
  );
}

/** @deprecated Used by legacy list variant only */
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
  matchPoints,
  groupPoints,
  knockoutPoints,
  latestPoints,
  latestPointsParts,
  latestGroup,
  latestGroupPoints,
  movement,
  showMovement = true,
  view = 'matcher',
  variant = 'list',
  nameId,
}) {
  if (variant === 'page') {
    return (
      <>
        <div className="lb-row-left">
          <RankBadge rank={rank} movement={showMovement ? movement : undefined} />
          <span className="lb-name" id={nameId}>
            {name}
          </span>
        </div>
        {view === 'totalt' ? (
          <div className="lb-row-right lb-row-right--totalt">
            <span className="lb-split-metric">{matchPoints ?? 0}</span>
            <span className="lb-split-metric">{groupPoints ?? 0}</span>
            <span className="lb-split-metric">{knockoutPoints ?? 0}</span>
            <span className="lb-points">{points}</span>
          </div>
        ) : null}
        {view === 'matcher' ? (
          <div className="lb-row-right">
            <LatestMatchPointsBadge points={latestPoints} pointsParts={latestPointsParts} />
            <span className="lb-points">{matchPoints ?? 0}</span>
          </div>
        ) : null}
        {view === 'grupper' ? (
          <div className="lb-row-right lb-row-right--groups">
            <GroupPointsBadge
              group={latestGroup}
              points={latestGroupPoints}
              className="lb-latest-points"
              empty
            />
            <span className="lb-points">{groupPoints ?? 0}</span>
          </div>
        ) : null}
        {view === 'topp3' ? (
          <div className="lb-row-right">
            <span className="lb-points">{knockoutPoints ?? 0}</span>
          </div>
        ) : null}
      </>
    );
  }

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
