import { useMemo, useState } from 'react';
import clsx from 'clsx';
import LeaderboardRow from '../components/LeaderboardRow.jsx';
import LeaderboardPlayerSheet from '../components/LeaderboardPlayerSheet.jsx';
import { useAllMatches } from '../hooks/useMatches.js';
import { useLatestMatchPoints } from '../hooks/useLatestMatchPoints.js';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import { useLockState } from '../hooks/useLockState.js';
import {
  rankMovementsFromLatestMatch,
  ranksFromEntries,
} from '../utils/leaderboardMovement.js';
import { nextLeaderboardSort, sortLeaderboardEntries } from '../utils/leaderboardSort.js';

const TOP_FIVE_COUNT = 5;

function LeaderboardDivider() {
  return (
    <div className="lb-divider" aria-hidden>
      <span className="lb-divider-line" />
      <span className="lb-divider-label">Utanför topp 5</span>
      <span className="lb-divider-line" />
    </div>
  );
}

function LeaderboardColumnHeader({ sort, onSort }) {
  return (
    <div className="lb-column-header" aria-hidden>
      <span className="lb-column-header-position">Position</span>
      <div className="lb-column-header-metrics">
        <button
          type="button"
          className={clsx('lb-column-sort', sort.key === 'latest' && 'is-active')}
          onClick={() => onSort('latest')}
          aria-sort={
            sort.key === 'latest'
              ? sort.dir === 'desc'
                ? 'descending'
                : 'ascending'
              : 'none'
          }
        >
          Senast
        </button>
        <button
          type="button"
          className={clsx('lb-column-sort', sort.key === 'total' && 'is-active')}
          onClick={() => onSort('total')}
          aria-sort={
            sort.key === 'total'
              ? sort.dir === 'desc'
                ? 'descending'
                : 'ascending'
              : 'none'
          }
        >
          Total
        </button>
      </div>
    </div>
  );
}

function LeaderboardEntryRow({
  entry,
  rank,
  movements,
  latestPoints,
  latestPointsReady,
  hasLatestMatch,
  openPlayer,
}) {
  const latest =
    hasLatestMatch && latestPointsReady
      ? (latestPoints[entry.userId] ?? 0)
      : null;

  return (
    <LeaderboardRow
      rank={rank}
      name={entry.name}
      points={entry.points}
      latestPoints={latest}
      movement={movements[entry.userId]}
      onPress={() => openPlayer(entry, rank)}
    />
  );
}

export default function LeaderboardPage() {
  const { entries, loading } = useLeaderboard();
  const { matches } = useAllMatches();
  const { now } = useLockState();
  const [selected, setSelected] = useState(null);
  const [sort, setSort] = useState({ key: 'total', dir: 'desc' });
  const { anchorMatchId, latestPoints, latestPointsReady } = useLatestMatchPoints(matches);

  const sorted = useMemo(
    () => sortLeaderboardEntries(entries, sort, latestPoints ?? {}),
    [entries, sort, latestPoints],
  );

  const ranks = useMemo(() => ranksFromEntries(sorted), [sorted]);

  const movements = useMemo(() => {
    if (!anchorMatchId || !latestPointsReady) return {};
    return rankMovementsFromLatestMatch(entries, latestPoints);
  }, [entries, anchorMatchId, latestPoints, latestPointsReady]);

  function openPlayer(entry, rank) {
    setSelected({
      userId: entry.userId,
      name: entry.name,
      points: entry.points,
      rank,
    });
  }

  function handleSort(key) {
    setSort((current) => nextLeaderboardSort(current, key));
  }

  const showTopFiveDivider = sort.key === 'total';
  const topEntries = showTopFiveDivider
    ? sorted.slice(0, TOP_FIVE_COUNT)
    : sorted;
  const restEntries = showTopFiveDivider ? sorted.slice(TOP_FIVE_COUNT) : [];

  return (
    <div className="leaderboard-page">
      {loading ? (
        <div className="lb-empty">Laddar…</div>
      ) : sorted.length === 0 ? (
        <div className="lb-empty">Inga deltagare ännu</div>
      ) : (
        <>
          <LeaderboardColumnHeader sort={sort} onSort={handleSort} />
          <div className="lb-list">
            {topEntries.map((entry) => (
              <LeaderboardEntryRow
                key={entry.userId}
                entry={entry}
                rank={ranks[entry.userId]}
                movements={movements}
                latestPoints={latestPoints}
                latestPointsReady={latestPointsReady}
                hasLatestMatch={Boolean(anchorMatchId)}
                openPlayer={openPlayer}
              />
            ))}
            {restEntries.length > 0 ? (
              <>
                <LeaderboardDivider />
                {restEntries.map((entry) => (
                  <LeaderboardEntryRow
                    key={entry.userId}
                    entry={entry}
                    rank={ranks[entry.userId]}
                    movements={movements}
                    latestPoints={latestPoints}
                    latestPointsReady={latestPointsReady}
                    hasLatestMatch={Boolean(anchorMatchId)}
                    openPlayer={openPlayer}
                  />
                ))}
              </>
            ) : null}
          </div>
        </>
      )}

      <LeaderboardPlayerSheet
        player={selected}
        matches={matches}
        now={now}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
