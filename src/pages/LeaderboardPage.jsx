import { useMemo, useRef, useState } from 'react';
import LeaderboardRow from '../components/LeaderboardRow.jsx';
import LeaderboardPlayerOverlay from '../components/LeaderboardPlayerOverlay.jsx';
import { useAllMatches } from '../hooks/useMatches.js';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import {
  latestFinishedMatchId,
  resolveRankMovements,
} from '../utils/leaderboardMovement.js';

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
      <header className="leaderboard-hero">
        <h1>Leaderboard</h1>
        <p>Vem vinner VM-tipset 2026</p>
      </header>

      {loading ? (
        <div className="lb-empty">Laddar…</div>
      ) : sorted.length === 0 ? (
        <div className="lb-empty">Inga deltagare ännu</div>
      ) : (
        <div className="lb-list">
          {sorted.map((entry, index) => (
            <LeaderboardRow
              key={entry.userId}
              ref={(node) => {
                if (node) rowRefs.current[entry.userId] = node;
                else delete rowRefs.current[entry.userId];
              }}
              rank={index + 1}
              name={entry.name}
              points={entry.points}
              movement={movements[entry.userId]}
              onPress={() => openPlayer(entry, index + 1)}
              className={selected?.userId === entry.userId ? 'is-selected' : undefined}
            />
          ))}
        </div>
      )}

      <LeaderboardPlayerOverlay
        player={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
