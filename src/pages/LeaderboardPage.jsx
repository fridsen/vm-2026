import { useMemo, useState } from 'react';
import clsx from 'clsx';
import LeaderboardRow from '../components/LeaderboardRow.jsx';
import LeaderboardPlayerSheet from '../components/LeaderboardPlayerSheet.jsx';
import LeaderboardSegmentedControl from '../components/LeaderboardSegmentedControl.jsx';
import { useTournamentMatches } from '../hooks/useMatches.js';
import { useLatestGroupPoints } from '../hooks/useLatestGroupPoints.js';
import { useLatestMatchPoints } from '../hooks/useLatestMatchPoints.js';
import { useLatestPodiumPoints } from '../hooks/useLatestPodiumPoints.js';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import { useLockState } from '../hooks/useLockState.js';
import {
  rankMovementsForTotalt,
  rankMovementsFromLatestMatch,
  rankMovementsFromScoreDelta,
  ranksFromOrderedEntries,
} from '../utils/leaderboardMovement.js';
import { nextLeaderboardSort, sortLeaderboardEntries } from '../utils/leaderboardSort.js';
import { latestPointsDisplayForUser } from '../utils/latestMatchPointsDisplay.js';
import { isKnockoutMatch } from '../utils/matchSchedule.js';

const TOP_FIVE_COUNT = 5;

const SCORE_KEY_BY_VIEW = {
  totalt: 'points',
  matcher: 'matchPoints',
  grupper: 'groupPoints',
  topp3: 'knockoutPoints',
};

function LeaderboardDivider() {
  return (
    <div className="lb-divider" aria-hidden>
      <span className="lb-divider-line" />
      <span className="lb-divider-label">Utanför topp 5</span>
      <span className="lb-divider-line" />
    </div>
  );
}

function LeaderboardColumnHeader({ view, sort, onSort }) {
  if (view === 'totalt') {
    return (
      <div className="lb-column-header lb-column-header--totalt" aria-hidden>
        <span className="lb-column-header-position">Position</span>
        <div className="lb-column-header-metrics lb-column-header-metrics--totalt">
          <span>Ma</span>
          <span>Gr</span>
          <span>T3</span>
          <span className="lb-column-header-tot">Tot</span>
        </div>
      </div>
    );
  }

  if (view === 'topp3') {
    return (
      <div className="lb-column-header" aria-hidden>
        <span className="lb-column-header-position">Position</span>
        <div className="lb-column-header-metrics">
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
            Poäng
          </button>
        </div>
      </div>
    );
  }

  const scoreLabel = view === 'grupper' ? 'Poäng' : 'Total';

  return (
    <div
      className={clsx(
        'lb-column-header',
        view === 'grupper' && 'lb-column-header--groups',
      )}
      aria-hidden
    >
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
          {scoreLabel}
        </button>
      </div>
    </div>
  );
}

function LeaderboardEntryRow({
  entry,
  rank,
  view,
  movements,
  latestPoints,
  latestPointsBreakdown,
  latestPointsReady,
  latestMatchCount,
  hasLatestMatch,
  anchorGroup,
  latestGroupPoints,
  latestGroupPointsReady,
  openPlayer,
}) {
  const latestParts =
    hasLatestMatch && latestPointsReady
      ? latestPointsDisplayForUser(
          entry.userId,
          latestPoints,
          latestPointsBreakdown,
          latestMatchCount,
        )
      : null;
  const latestTotal =
    latestParts != null ? latestParts.reduce((sum, value) => sum + value, 0) : null;

  const latestGroupScore =
    anchorGroup && latestGroupPointsReady
      ? (latestGroupPoints[entry.userId] ?? 0)
      : null;

  const showMovement = view === 'totalt' || view === 'matcher' || view === 'topp3';

  return (
    <LeaderboardRow
      rank={rank}
      name={entry.name}
      points={entry.points}
      matchPoints={entry.matchPoints}
      groupPoints={entry.groupPoints}
      knockoutPoints={entry.knockoutPoints}
      latestPoints={latestTotal}
      latestPointsParts={latestParts}
      latestGroup={anchorGroup}
      latestGroupPoints={latestGroupScore}
      movement={movements[entry.userId]}
      showMovement={showMovement}
      view={view}
      onPress={() => openPlayer(entry, rank)}
    />
  );
}

export default function LeaderboardPage() {
  const { entries, loading } = useLeaderboard();
  const { matches } = useTournamentMatches();
  const { now } = useLockState();
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('totalt');
  const [sort, setSort] = useState({ key: 'total', dir: 'desc' });

  const groupMatches = useMemo(
    () => (matches ?? []).filter((m) => !isKnockoutMatch(m)),
    [matches],
  );

  const {
    anchorMatchId,
    anchorMatchIds,
    anchorMatches,
    latestPoints,
    latestPointsBreakdown,
    latestPointsReady,
  } = useLatestMatchPoints(groupMatches);
  const { anchorGroup, latestPoints: latestGroupPoints, latestPointsReady: latestGroupPointsReady } =
    useLatestGroupPoints(matches);
  const {
    latestPodiumKickoff,
    latestPodiumPoints,
    latestPodiumPointsReady,
  } = useLatestPodiumPoints(matches);

  const scoreKey = SCORE_KEY_BY_VIEW[view] ?? 'points';

  const latestSortPoints = useMemo(() => {
    if (view === 'grupper') {
      return latestGroupPoints ?? {};
    }
    if (view === 'matcher') {
      return latestPoints ?? {};
    }
    return {};
  }, [view, latestGroupPoints, latestPoints]);

  const sorted = useMemo(
    () =>
      sortLeaderboardEntries(entries, sort, latestSortPoints, { scoreKey }),
    [entries, sort, latestSortPoints, scoreKey],
  );

  const ranks = useMemo(
    () => ranksFromOrderedEntries(sorted, scoreKey),
    [sorted, scoreKey],
  );

  const movements = useMemo(() => {
    if (view === 'matcher') {
      if (!anchorMatchId || !latestPointsReady) return {};
      return rankMovementsFromLatestMatch(entries, latestPoints);
    }
    if (view === 'topp3') {
      if (!latestPodiumPointsReady) return {};
      return rankMovementsFromScoreDelta(
        entries,
        latestPodiumPoints ?? {},
        'knockoutPoints',
      );
    }
    if (view === 'totalt') {
      if (!latestPointsReady && !latestPodiumPointsReady) return {};
      return rankMovementsForTotalt(entries, {
        matches,
        latestMatchPoints: latestPointsReady ? latestPoints : {},
        latestMatchKickoff: anchorMatches[0]?.kickoff ?? null,
        latestPodiumPoints: latestPodiumPointsReady ? latestPodiumPoints : {},
        latestPodiumKickoff,
      });
    }
    return {};
  }, [
    view,
    entries,
    matches,
    anchorMatchId,
    anchorMatches,
    latestPoints,
    latestPointsReady,
    latestPodiumKickoff,
    latestPodiumPoints,
    latestPodiumPointsReady,
  ]);

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

  function handleViewChange(nextView) {
    setView(nextView);
    setSort({ key: 'total', dir: 'desc' });
  }

  const showTopFiveDivider = view === 'totalt' && sort.key === 'total';
  const topEntries = showTopFiveDivider ? sorted.slice(0, TOP_FIVE_COUNT) : sorted;
  const restEntries = showTopFiveDivider ? sorted.slice(TOP_FIVE_COUNT) : [];

  const listView =
    view === 'totalt' || view === 'matcher' || view === 'grupper' || view === 'topp3';

  return (
    <div
      className={clsx(
        'leaderboard-page',
        view === 'totalt' && 'lb-view-totalt',
        view === 'matcher' && anchorMatchIds.length > 1 && 'lb-has-split-latest',
        view === 'grupper' && anchorGroup && 'lb-has-group-latest',
        view === 'topp3' && 'lb-view-topp3',
      )}
    >
      <LeaderboardSegmentedControl value={view} onChange={handleViewChange} />

      {loading ? (
        <div className="lb-empty">Laddar…</div>
      ) : sorted.length === 0 ? (
        <div className="lb-empty">Inga deltagare ännu</div>
      ) : listView ? (
        <>
          <LeaderboardColumnHeader view={view} sort={sort} onSort={handleSort} />
          <div className="lb-list">
            {topEntries.map((entry) => (
              <LeaderboardEntryRow
                key={entry.userId}
                entry={entry}
                rank={ranks[entry.userId]}
                view={view}
                movements={movements}
                latestPoints={latestPoints}
                latestPointsBreakdown={latestPointsBreakdown}
                latestPointsReady={latestPointsReady}
                latestMatchCount={anchorMatchIds.length}
                hasLatestMatch={Boolean(anchorMatchId)}
                anchorGroup={anchorGroup}
                latestGroupPoints={latestGroupPoints}
                latestGroupPointsReady={latestGroupPointsReady}
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
                    view={view}
                    movements={movements}
                    latestPoints={latestPoints}
                    latestPointsBreakdown={latestPointsBreakdown}
                    latestPointsReady={latestPointsReady}
                    latestMatchCount={anchorMatchIds.length}
                    hasLatestMatch={Boolean(anchorMatchId)}
                    anchorGroup={anchorGroup}
                    latestGroupPoints={latestGroupPoints}
                    latestGroupPointsReady={latestGroupPointsReady}
                    openPlayer={openPlayer}
                  />
                ))}
              </>
            ) : null}
          </div>
        </>
      ) : null}

      <LeaderboardPlayerSheet
        player={selected}
        matches={matches}
        now={now}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
