import { useMemo, useState } from 'react';
import LeaderboardRow from '../components/LeaderboardRow.jsx';
import LeaderboardPlayerSheet from '../components/LeaderboardPlayerSheet.jsx';
import { useAllMatches } from '../hooks/useMatches.js';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import { useLockState } from '../hooks/useLockState.js';
import {
  latestFinishedMatchId,
  ranksFromEntries,
  resolveRankMovements,
  sortLeaderboardEntries,
} from '../utils/leaderboardMovement.js';

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

function LeaderboardEntryRow({ entry, rank, movements, openPlayer }) {
  return (
    <LeaderboardRow
      rank={rank}
      name={entry.name}
      points={entry.points}
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

  const sorted = useMemo(() => sortLeaderboardEntries(entries), [entries]);

  const ranks = useMemo(() => ranksFromEntries(sorted), [sorted]);

  const anchorMatchId = useMemo(() => latestFinishedMatchId(matches), [matches]);

  const movements = useMemo(
    () => resolveRankMovements(sorted, anchorMatchId),
    [sorted, anchorMatchId],
  );

  function openPlayer(entry, rank) {
    setSelected({
      userId: entry.userId,
      name: entry.name,
      points: entry.points,
      rank,
    });
  }

  return (
    <div className="leaderboard-page">
      {loading ? (
        <div className="lb-empty">Laddar…</div>
      ) : sorted.length === 0 ? (
        <div className="lb-empty">Inga deltagare ännu</div>
      ) : (
        <div className="lb-list">
          {sorted.slice(0, TOP_FIVE_COUNT).map((entry) => (
            <LeaderboardEntryRow
              key={entry.userId}
              entry={entry}
              rank={ranks[entry.userId]}
              movements={movements}
              openPlayer={openPlayer}
            />
          ))}
          {sorted.length > TOP_FIVE_COUNT ? (
            <>
              <LeaderboardDivider />
              {sorted.slice(TOP_FIVE_COUNT).map((entry) => (
                <LeaderboardEntryRow
                  key={entry.userId}
                  entry={entry}
                  rank={ranks[entry.userId]}
                  movements={movements}
                  openPlayer={openPlayer}
                />
              ))}
            </>
          ) : null}
        </div>
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
