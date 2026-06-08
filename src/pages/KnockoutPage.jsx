import { useMemo } from 'react';
import clsx from 'clsx';
import { useKnockoutMatches } from '../hooks/useMatches.js';
import { useTeams } from '../hooks/useTeams.js';

const ROUND_LABELS = {
  R32: 'Sextondelsfinal',
  R16: 'Åttondelsfinal',
  QF: 'Kvartsfinal',
  SF: 'Semifinal',
  BRONZE: 'Bronsmatch',
  FINAL: 'Final',
};

const ROUNDS_TO_SHOW = ['R32', 'R16', 'QF', 'SF'];

function BracketTeam({ teamId, score, winner, tbd }) {
  const { getTeamById } = useTeams();
  const team = teamId ? getTeamById(teamId) : null;
  return (
    <div className={clsx('bracket-team', winner && 'winner', tbd && 'tbd')}>
      <div className="bt-flag" aria-hidden>
        {team?.flag ?? '?'}
      </div>
      <div className="bt-name">{team?.code ?? 'TBD'}</div>
      <div className="bt-score">{score ?? '–'}</div>
    </div>
  );
}

function BracketMatch({ match }) {
  const result = match.result;
  const isTbd = !match.homeTeamId && !match.awayTeamId;
  const homeWins = result && result.home > result.away;
  const awayWins = result && result.away > result.home;
  return (
    <div className="bracket-match stagger-child">
      <BracketTeam
        teamId={match.homeTeamId}
        score={result?.home}
        winner={homeWins}
        tbd={!match.homeTeamId}
      />
      <BracketTeam
        teamId={match.awayTeamId}
        score={result?.away}
        winner={awayWins}
        tbd={!match.awayTeamId}
      />
      {isTbd && null}
    </div>
  );
}

/**
 * Render N matches as <rows> of 2 per row.
 */
function BracketRows({ matches }) {
  const rows = [];
  for (let i = 0; i < matches.length; i += 2) {
    rows.push(matches.slice(i, i + 2));
  }
  return (
    <>
      {rows.map((row, i) => (
        <div key={i} className="bracket-row">
          {row.map((m) => (
            <BracketMatch key={m.id} match={m} />
          ))}
        </div>
      ))}
    </>
  );
}

export function KnockoutContent() {
  const { matches } = useKnockoutMatches();

  const byRound = useMemo(() => {
    const map = {};
    for (const r of ROUNDS_TO_SHOW) map[r] = [];
    map.FINAL = [];
    for (const m of matches) {
      if (!map[m.round]) map[m.round] = [];
      map[m.round].push(m);
    }
    return map;
  }, [matches]);

  const finalMatch = byRound.FINAL?.[0];

  return (
    <div className="py-3">
        {ROUNDS_TO_SHOW.map((round, idx) => {
          const list = byRound[round] || [];
          if (list.length === 0) return null;
          return (
            <div key={round} className={clsx(idx > 0 && 'mt-4')}>
              <div className="round-label">{ROUND_LABELS[round]}</div>
              <BracketRows matches={list} />
            </div>
          );
        })}

        {finalMatch && (
          <div className="mt-4">
            <div className="round-label">Final · 19 jul · MetLife Stadium</div>
            <div className="final-card stagger-child">
              <div className="final-label">🏆 Finalen</div>
              <div className="flex items-stretch">
                <div className="flex-1">
                  <BracketTeam
                    teamId={finalMatch.homeTeamId}
                    score={finalMatch.result?.home}
                    winner={
                      finalMatch.result &&
                      finalMatch.result.home > finalMatch.result.away
                    }
                    tbd={!finalMatch.homeTeamId}
                  />
                </div>
                <div className="flex items-center px-2">
                  <span className="font-display text-base tracking-wide text-neutral-500/30">
                    VS
                  </span>
                </div>
                <div className="flex-1">
                  <BracketTeam
                    teamId={finalMatch.awayTeamId}
                    score={finalMatch.result?.away}
                    winner={
                      finalMatch.result &&
                      finalMatch.result.away > finalMatch.result.home
                    }
                    tbd={!finalMatch.awayTeamId}
                  />
                </div>
              </div>
            </div>

            <div className="champion-card stagger-child">
              <div className="champion-trophy">🏆</div>
              <div className="champion-label">Världsmästare 2026</div>
              <div className="champion-team text-neutral-500">Återstår att se…</div>
            </div>
          </div>
        )}
    </div>
  );
}
