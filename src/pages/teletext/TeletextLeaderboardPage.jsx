import { useMemo } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useLeaderboard } from '../../hooks/useLeaderboard.js';
import { useLockState } from '../../hooks/useLockState.js';
import { ranksFromEntries, sortLeaderboardEntries } from '../../utils/leaderboardMovement.js';
import { formatTeletextRank } from '../../utils/teletextDisplay.js';

const TOP_FIVE_COUNT = 5;

export default function TeletextLeaderboardPage() {
  const { user } = useAuth();
  const { entries, loading } = useLeaderboard();
  const { now } = useLockState();

  const sorted = useMemo(() => sortLeaderboardEntries(entries), [entries]);
  const ranks = useMemo(() => ranksFromEntries(sorted), [sorted]);
  const updatedLabel = format(new Date(now), 'yyyy-MM-dd * HH:mm');

  if (loading) {
    return <p className="teletext-row teletext-row--cyan">Laddar…</p>;
  }

  if (sorted.length === 0) {
    return <p className="teletext-row teletext-row--cyan">Inga deltagare ännu</p>;
  }

  return (
    <div className="teletext-leaderboard-page">
      <p className="teletext-row teletext-row--green teletext-leaderboard-updated">
        Senast ändrad {updatedLabel}
      </p>

      <div className="teletext-leaderboard-list">
        {sorted.map((entry, index) => {
          const rank = ranks[entry.userId];
          const isMe = entry.userId === user?.id;
          const isTopFive = index < TOP_FIVE_COUNT;

          return (
            <div key={entry.userId}>
              {index === TOP_FIVE_COUNT && sorted.length > TOP_FIVE_COUNT ? (
                <div className="teletext-leaderboard-gap" aria-hidden />
              ) : null}
              <div
                className={clsx(
                  'teletext-leaderboard-row',
                  isMe && 'is-me',
                  isTopFive && !isMe && 'is-top-five',
                )}
              >
                <div className="teletext-leaderboard-left">
                  <span className="teletext-leaderboard-rank">
                    {formatTeletextRank(rank)}
                  </span>
                  <span className="teletext-leaderboard-name">{entry.name}</span>
                </div>
                <span className="teletext-leaderboard-points">{entry.points}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
