import { useMemo, useRef, useState } from 'react';
import LeaderboardRow from '../components/LeaderboardRow.jsx';
import LeaderboardPlayerOverlay from '../components/LeaderboardPlayerOverlay.jsx';
import { useAllMatches } from '../hooks/useMatches.js';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import {
  latestFinishedMatchId,
  resolveRankMovements,
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

function LeaderboardEntryRow({ entry, index, movements, selected, rowRefs, openPlayer }) {
  const rank = index + 1;
  return (
    <LeaderboardRow
      ref={(node) => {
        if (node) rowRefs.current[entry.userId] = node;
        else delete rowRefs.current[entry.userId];
      }}
      rank={rank}
      name={entry.name}
      points={entry.points}
      movement={movements[entry.userId]}
      onPress={() => openPlayer(entry, rank)}
      className={selected?.userId === entry.userId ? 'is-selected' : undefined}
    />
  );
}

export default function LeaderboardPage() {
  const { entries, loading } = useLeaderboard();
  const { matches } = useAllMatches();
  const rowRefs = useRef({});
  const [selected, setSelected] = useState(null);

  const sorted = useMemo(
    () =>
      [...entries].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (a.name ?? '').localeCompare(b.name ?? '', 'sv');
      }),
    [entries],
  );

  const anchorMatchId = useMemo(() => latestFinishedMatchId(matches), [matches]);

  const movements = useMemo(
    () => resolveRankMovements(sorted, anchorMatchId),
    [sorted, anchorMatchId],
  );

  function openPlayer(entry, rank) {
    const node = rowRefs.current[entry.userId];
    const anchorRect = node?.getBoundingClientRect() ?? null;
    setSelected({
      userId: entry.userId,
      name: entry.name,
      points: entry.points,
      rank,
      movement: movements[entry.userId],
      anchorRect,
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
          {sorted.slice(0, TOP_FIVE_COUNT).map((entry, index) => (
            <LeaderboardEntryRow
              key={entry.userId}
              entry={entry}
              index={index}
              movements={movements}
              selected={selected}
              rowRefs={rowRefs}
              openPlayer={openPlayer}
            />
          ))}
          {sorted.length > TOP_FIVE_COUNT ? (
            <>
              <LeaderboardDivider />
              {sorted.slice(TOP_FIVE_COUNT).map((entry, index) => (
                <LeaderboardEntryRow
                  key={entry.userId}
                  entry={entry}
                  index={index + TOP_FIVE_COUNT}
                  movements={movements}
                  selected={selected}
                  rowRefs={rowRefs}
                  openPlayer={openPlayer}
                />
              ))}
            </>
          ) : null}
        </div>
      )}

      <LeaderboardPlayerOverlay
        player={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
