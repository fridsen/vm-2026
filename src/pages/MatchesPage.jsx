import { useMemo, useState } from 'react';
import { useAllMatches } from '../hooks/useMatches.js';
import { useLockState } from '../hooks/useLockState.js';
import { usePredictions } from '../hooks/usePredictions.js';
import { GROUPS } from '../data/teams.js';
import PageHeader from '../components/PageHeader.jsx';
import GameRow from '../components/GameRow.jsx';
import PredictionSheet from '../components/PredictionSheet.jsx';
import LockBadge from '../components/LockBadge.jsx';
import { STATE } from '../utils/lockRules.js';
import { flattenMatchesByGroup } from '../utils/matchSchedule.js';

export default function MatchesPage() {
  const { matches, loading } = useAllMatches();
  const { now, groupLocked } = useLockState();
  const { predictions, updateMatch } = usePredictions();
  const [predictMatch, setPredictMatch] = useState(null);

  const matchesByGroup = useMemo(() => {
    const map = {};
    for (const g of GROUPS) map[g] = [];
    for (const m of matches) {
      if (map[m.group]) map[m.group].push(m);
    }
    for (const g of GROUPS) {
      map[g].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    }
    return map;
  }, [matches]);

  const totalPredicted = predictions ? Object.keys(predictions.matches || {}).length : 0;
  const lockState = groupLocked ? STATE.LOCKED : STATE.OPEN;

  // Matches in the same order they're rendered on this page (group A→L,
  // kickoff within each group). The sheet's prev/next arrows walk this
  // list so navigation lines up with what the user sees on screen.
  const orderedMatches = useMemo(() => flattenMatchesByGroup(matches), [matches]);
  const sheetIndex = predictMatch
    ? orderedMatches.findIndex((m) => m.id === predictMatch.id)
    : -1;
  const prevMatch = sheetIndex > 0 ? orderedMatches[sheetIndex - 1] : null;
  const nextMatch =
    sheetIndex >= 0 && sheetIndex < orderedMatches.length - 1
      ? orderedMatches[sheetIndex + 1]
      : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <PageHeader title="Matcher" subtitle="Laddar…" />
        <div className="card p-8 text-center text-neutral-500">Laddar matcher…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-2">
      <PageHeader
        title="Matcher"
        subtitle="Gruppspel · 72 matcher"
        right={
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tabular-nums text-neutral-900">
              <span className="text-neutral-500">{totalPredicted}</span> / 72
            </span>
            <LockBadge state={lockState} />
          </div>
        }
      />

      {GROUPS.map((g) => {
        const games = matchesByGroup[g] || [];
        if (games.length === 0) return null;
        return (
          <section key={g}>
            <div className="group-section-title">Grupp {g}</div>
            {games.map((m) => (
              <GameRow
                key={m.id}
                match={m}
                now={now}
                prediction={predictions?.matches?.[m.id]}
                onPredict={groupLocked ? undefined : () => setPredictMatch(m)}
              />
            ))}
          </section>
        );
      })}

      {groupLocked && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-center text-sm text-amber-800">
          Tippningen är låst sedan första gruppspelsmatchen startade.
        </div>
      )}

      <PredictionSheet
        match={predictMatch}
        prediction={predictMatch ? predictions?.matches?.[predictMatch.id] : null}
        disabled={groupLocked}
        onClose={() => setPredictMatch(null)}
        onSave={({ home, away, outcome }) => {
          if (predictMatch) updateMatch(predictMatch.id, { home, away, outcome });
        }}
        hasPrev={!!prevMatch}
        hasNext={!!nextMatch}
        onPrev={() => prevMatch && setPredictMatch(prevMatch)}
        onNext={() => nextMatch && setPredictMatch(nextMatch)}
      />
    </div>
  );
}
