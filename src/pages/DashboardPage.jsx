import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import clsx from 'clsx';
import { useAllMatches } from '../hooks/useMatches.js';
import { useLockState } from '../hooks/useLockState.js';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import { usePredictions } from '../hooks/usePredictions.js';
import { useAuth } from '../hooks/useAuth.js';
import { getTeamById, GROUPS, getTeamsByGroup } from '../data/teams.js';
import {
  MATCH_STATE,
  getMatchState,
  getMatchDayKey,
  flattenMatchesByGroup,
} from '../utils/matchSchedule.js';
import PageHeader from '../components/PageHeader.jsx';
import GameRow from '../components/GameRow.jsx';
import PredictionSheet from '../components/PredictionSheet.jsx';

const TOTAL_GROUP_MATCHES = 72;

function CountdownHero({ deadlineMs }) {
  const total = Math.max(0, deadlineMs ?? 0);
  const days = Math.floor(total / 86400000);
  const hours = Math.floor((total % 86400000) / 3600000);
  const mins = Math.floor((total % 3600000) / 60000);
  const secs = Math.floor((total % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="countdown-hero stagger-child">
      <div className="cd-eyebrow">⚽ FIFA World Cup 2026</div>
      <div className="cd-units">
        <Unit val={days} label="Dagar" />
        <span className="cd-sep">:</span>
        <Unit val={pad(hours)} label="Tim" />
        <span className="cd-sep">:</span>
        <Unit val={pad(mins)} label="Min" />
        <span className="cd-sep">:</span>
        <Unit val={pad(secs)} label="Sek" />
      </div>
      <div className="cd-date">🗓 11 jun 2026 · Mexico City</div>
    </div>
  );
}
function Unit({ val, label }) {
  return (
    <div className="cd-unit">
      <div className="cd-unit-val">{val}</div>
      <div className="cd-unit-label">{label}</div>
    </div>
  );
}

function PredProgressCard({ predicted, total, onContinue, hasNext }) {
  const pct = Math.round((predicted / total) * 100);
  const remaining = Math.max(0, total - predicted);
  const dashTotal = 207; // matches circle circumference
  const dashOffset = dashTotal - (dashTotal * pct) / 100;
  const allDone = remaining === 0;

  return (
    <div className="pred-progress-card stagger-child">
      <div className="flex items-center gap-4">
        <div className="relative h-[76px] w-[76px] shrink-0">
          <svg viewBox="0 0 76 76" className="h-[76px] w-[76px] -rotate-90">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#A8D227" />
                <stop offset="100%" stopColor="#C9F73B" />
              </linearGradient>
            </defs>
            <circle className="ring-track" cx="38" cy="38" r="33" />
            <circle
              className="ring-fill"
              cx="38"
              cy="38"
              r="33"
              strokeDasharray={dashTotal}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-xl leading-none text-neutral-900">{pct}%</div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
              Tippat
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="pred-prog-title">Lås in dina tipp</div>
          <div className="pred-prog-sub">
            Du har <strong className="text-accent">{remaining} matcher</strong> kvar att tippa
            innan turneringen drar igång.
          </div>
          <div className="pred-prog-counts">
            <span className="done">{predicted} tippade</span>
            <span>{remaining} kvar</span>
          </div>
        </div>
      </div>
      <div className="pred-prog-bar-wrap">
        <div className="pred-prog-bar" style={{ width: `${pct}%` }} />
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={!hasNext}
        className="pred-prog-cta disabled:cursor-default disabled:opacity-50"
      >
        {allDone ? 'Alla matcher tippade ✓' : 'Fortsätt tippa →'}
      </button>
    </div>
  );
}

function PreWcView({ matches, predictions, onPredict }) {
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

  return (
    <div className="space-y-1">
      {GROUPS.map((g) => {
        const games = matchesByGroup[g] || [];
        const predictedCount = games.filter((m) => predictions?.matches?.[m.id]).length;
        const allDone = predictedCount === games.length && games.length > 0;
        return (
          <section key={g}>
            <div className="prewc-group-header">
              <div className="prewc-group-name">Grupp {g}</div>
              <div className={clsx('prewc-group-prog', allDone && 'all-done')}>
                {allDone ? `✓ ${predictedCount} / ${games.length}` : `${predictedCount} / ${games.length}`}
              </div>
            </div>
            {games.map((m) => {
              const home = getTeamById(m.homeTeamId);
              const away = getTeamById(m.awayTeamId);
              const pred = predictions?.matches?.[m.id];
              return (
                <div
                  key={m.id}
                  className={clsx('prewc-game stagger-child', pred && 'predicted')}
                  onClick={() => onPredict(m)}
                >
                  <div className="prewc-teams">
                    <span className="prewc-flag" aria-hidden>
                      {home?.flag}
                    </span>
                    <span className="prewc-team-name">{home?.code}</span>
                    <span className="prewc-vs">vs</span>
                    <span className="prewc-flag" aria-hidden>
                      {away?.flag}
                    </span>
                    <span className="prewc-team-name">{away?.code}</span>
                  </div>
                  <div className="prewc-date">
                    {format(new Date(m.kickoff), 'd MMM', { locale: sv })}
                  </div>
                  <div>
                    {pred ? (
                      <span className="prewc-done-badge">
                        ✓ {pred.home}–{pred.away}
                      </span>
                    ) : (
                      <span className="prewc-predict-btn">Tippa</span>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

function LiveView({ matches, now, predictions, onPredict, myEntry, myRank, totalPlayers }) {
  // Date ticker — next N days that have matches
  const days = useMemo(() => {
    const todayKey = format(new Date(now), 'yyyy-MM-dd');
    const byDay = new Map();
    for (const m of matches) {
      const dk = getMatchDayKey(m.kickoff);
      if (!byDay.has(dk)) byDay.set(dk, []);
      byDay.get(dk).push(m);
    }
    return [...byDay.entries()]
      .filter(([dk]) => dk >= todayKey)
      .slice(0, 7)
      .map(([dk, dayMatches]) => {
        const date = new Date(`${dk}T12:00:00`);
        const hasLive = dayMatches.some((m) => getMatchState(m, now) === MATCH_STATE.LIVE);
        return {
          dayKey: dk,
          date,
          isToday: dk === todayKey,
          hasLive,
        };
      });
  }, [matches, now]);

  const todaysMatches = useMemo(() => {
    const todayKey = format(new Date(now), 'yyyy-MM-dd');
    return matches
      .filter((m) => getMatchDayKey(m.kickoff) === todayKey)
      .filter((m) => getMatchState(m, now) !== MATCH_STATE.FINISHED)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  }, [matches, now]);

  const upcomingMatches = useMemo(() => {
    if (todaysMatches.length > 0) return todaysMatches;
    return matches
      .filter((m) => getMatchState(m, now) === MATCH_STATE.UPCOMING)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
      .slice(0, 3);
  }, [matches, todaysMatches, now]);

  const liveCount = upcomingMatches.filter(
    (m) => getMatchState(m, now) === MATCH_STATE.LIVE,
  ).length;
  const predCount = predictions ? Object.keys(predictions.matches || {}).length : 0;
  const correctCount = useMemo(() => {
    if (!predictions?.matches) return 0;
    let n = 0;
    for (const m of matches) {
      const pred = predictions.matches[m.id];
      if (!pred || !m.result) continue;
      if (pred.home === m.result.home && pred.away === m.result.away) n++;
    }
    return n;
  }, [matches, predictions]);
  const finishedPredictionCount = useMemo(() => {
    if (!predictions?.matches) return 0;
    return matches.filter((m) => m.result && predictions.matches[m.id]).length;
  }, [matches, predictions]);
  const accuracy = finishedPredictionCount
    ? Math.round((correctCount / finishedPredictionCount) * 100)
    : 0;

  return (
    <div className="space-y-3">
      {/* Date ticker */}
      <div className="date-ticker">
        {days.map((d) => (
          <Link
            key={d.dayKey}
            to="/matcher"
            className={clsx('date-chip stagger-child', d.isToday && 'today')}
          >
            <div className="d-day">{format(d.date, 'd')}</div>
            <div className="d-label">
              {d.isToday ? 'Idag' : format(d.date, 'EEE', { locale: sv })}
            </div>
          </Link>
        ))}
      </div>

      {/* Predict banner */}
      {upcomingMatches.length > 0 && (
        <Link to="/matcher" className="predict-banner stagger-child">
          <div className="relative z-10">
            <div className="pb-eyebrow">⚡ Missa inte</div>
            <div className="pb-headline">
              {todaysMatches.length > 0
                ? `${todaysMatches.length} matcher idag`
                : `Nästa: ${format(new Date(upcomingMatches[0].kickoff), 'd MMM', { locale: sv })}`}
            </div>
            <div className="pb-count">Tippa nu →</div>
          </div>
          <div className="pb-cta relative z-10">Tippa</div>
        </Link>
      )}

      {/* Stats grid */}
      <div className="section-label">Din statistik</div>
      <div className="stats-grid">
        <Link to="/leaderboard" className="stat-card stagger-child">
          <div className="sc-label">Placering</div>
          <div className="sc-value">{myRank === -1 ? '–' : `#${myRank + 1}`}</div>
          <div className="sc-sub">av {totalPlayers}</div>
        </Link>
        <Link to="/leaderboard" className="stat-card stagger-child">
          <div className="sc-label">Poäng</div>
          <div className="sc-value">{myEntry?.points ?? 0}</div>
          <div className="sc-sub">denna turnering</div>
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card stagger-child">
          <div className="sc-label">Träffsäkerhet</div>
          <div className="sc-value">{accuracy}</div>
          <div className="sc-sub">% rätt</div>
        </div>
        <Link to="/matcher" className="stat-card stagger-child">
          <div className="sc-label">Tippade</div>
          <div className="sc-value">{predCount}</div>
          <div className="sc-sub">av {TOTAL_GROUP_MATCHES} matcher</div>
        </Link>
      </div>

      {/* Today's matches */}
      <div className="section-label">
        {todaysMatches.length > 0 ? 'Dagens matcher' : 'Närmaste matcher'}
        {liveCount > 0 && <span className="ml-2 text-red-600">· {liveCount} live</span>}
      </div>
      {upcomingMatches.length === 0 ? (
        <div className="card p-6 text-center text-sm text-neutral-500">Inga matcher idag.</div>
      ) : (
        <div>
          {upcomingMatches.map((m) => (
            <GameRow
              key={m.id}
              match={m}
              now={now}
              prediction={predictions?.matches?.[m.id]}
              onPredict={() => onPredict(m)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { matches } = useAllMatches();
  const { now, globalDeadline, groupLocked } = useLockState();
  const { entries } = useLeaderboard();
  const { predictions, updateMatch } = usePredictions();
  const { user, profile } = useAuth();
  const myUserId = user?.id;
  const myName = profile?.display_name || user?.email || 'Jimmy';
  const [predictMatch, setPredictMatch] = useState(null);

  const deadlineMs = globalDeadline
    ? new Date(globalDeadline).getTime() - now
    : null;
  const tournamentStarted = groupLocked || (deadlineMs != null && deadlineMs <= 0);

  // View toggle defaults to whichever is most relevant at first mount; user can override.
  const [view, setView] = useState(() => (tournamentStarted ? 'live' : 'prewc'));

  const predicted = predictions ? Object.keys(predictions.matches || {}).length : 0;
  const myEntry = entries.find((e) => e.userId === myUserId);
  const sortedEntries = [...entries].sort((a, b) => b.points - a.points);
  const myRank = sortedEntries.findIndex((e) => e.userId === myUserId);

  // All matches in the same order they're shown on the page (group A→L,
  // kickoff within each group). The bottom-sheet arrows walk this list so
  // navigation matches the visible list order.
  const orderedMatches = useMemo(() => flattenMatchesByGroup(matches), [matches]);

  // Next match the user hasn't tipped yet — drives the "Fortsätt tippa" CTA.
  const nextUnpredicted = useMemo(
    () => orderedMatches.find((m) => !predictions?.matches?.[m.id]) || null,
    [orderedMatches, predictions],
  );

  // Prev / next neighbours of the match currently in the sheet.
  const sheetIndex = predictMatch
    ? orderedMatches.findIndex((m) => m.id === predictMatch.id)
    : -1;
  const prevMatch = sheetIndex > 0 ? orderedMatches[sheetIndex - 1] : null;
  const nextMatch =
    sheetIndex >= 0 && sheetIndex < orderedMatches.length - 1
      ? orderedMatches[sheetIndex + 1]
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="VM 2026"
        subtitle={
          tournamentStarted ? 'Gruppspel · pågående' : 'Pre-turnering · 11 jun'
        }
        right={
          <div className="flex items-center gap-2">
            <div className="view-switch">
              <button
                type="button"
                className={clsx('vs-btn', view === 'prewc' && 'active')}
                onClick={() => setView('prewc')}
              >
                Pre-WC
              </button>
              <button
                type="button"
                className={clsx('vs-btn', view === 'live' && 'active')}
                onClick={() => setView('live')}
              >
                Live
              </button>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full font-display text-base tracking-wider text-white"
              style={{ background: 'linear-gradient(135deg, #6D28D9, #DB2777)' }}
            >
              {myName?.[0] ?? 'J'}
            </div>
          </div>
        }
      />

      {view === 'prewc' && (
        <>
          <CountdownHero deadlineMs={deadlineMs} />
          <PredProgressCard
            predicted={predicted}
            total={TOTAL_GROUP_MATCHES}
            hasNext={!!nextUnpredicted}
            onContinue={() => nextUnpredicted && setPredictMatch(nextUnpredicted)}
          />
          <PreWcView
            matches={matches}
            predictions={predictions}
            onPredict={(m) => setPredictMatch(m)}
          />
        </>
      )}
      {view === 'live' && (
        <LiveView
          matches={matches}
          now={now}
          predictions={predictions}
          onPredict={(m) => setPredictMatch(m)}
          myEntry={myEntry}
          myRank={myRank}
          totalPlayers={entries.length}
        />
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
