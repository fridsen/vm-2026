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
import {
  MATCH_STATE,
  getMatchState,
  getMatchDayKey,
  flattenMatchesByGroup,
} from '../utils/matchSchedule.js';
import PageHeader from '../components/PageHeader.jsx';
import MatchCard from '../components/MatchCard.jsx';
import PredictionSheet from '../components/PredictionSheet.jsx';
import RulesSheet from '../components/RulesSheet.jsx';
import checklistIcon from '../assets/home/checklist-icon.svg';
import rulesIcon from '../assets/home/rules-icon.svg';
import matchesIcon from '../assets/mina-tips/matches-icon.svg';
import groupsIcon from '../assets/mina-tips/groups-icon.svg';
import winnerIcon from '../assets/mina-tips/winner-icon.svg';

const TOTAL_GROUP_MATCHES = 72;

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M7 4.5L11.5 9L7 13.5"
        stroke="#60748D"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 17H9M18 9.8C18 8.25 17.37 6.76 16.24 5.67C15.12 4.58 13.59 4 12 4C10.41 4 8.88 4.58 7.76 5.67C6.63 6.76 6 8.25 6 9.8C6 12.3 5.4 14.02 4.72 15.12C4.28 15.84 4.06 16.2 4.07 16.3C4.08 16.41 4.1 16.45 4.19 16.52C4.27 16.6 4.63 16.6 5.35 16.6H18.65C19.37 16.6 19.73 16.6 19.81 16.52C19.9 16.45 19.92 16.41 19.93 16.3C19.94 16.2 19.72 15.84 19.28 15.12C18.6 14.02 18 12.3 18 9.8Z"
        stroke="#0C162A"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PreWcHomeHeader({ name }) {
  const initials = (name || 'Du')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <header className="home-topbar">
      <div className="home-profile">
        <div className="home-avatar">{initials || 'DU'}</div>
        <div>
          <div className="home-welcome">Välkommen!</div>
          <div className="home-name">{name}</div>
        </div>
      </div>
      <button type="button" className="home-bell" aria-label="Notiser">
        <BellIcon />
      </button>
    </header>
  );
}

function PreWcHero({ deadlineMs }) {
  const total = Math.max(0, deadlineMs ?? 0);
  const days = Math.floor(total / 86400000);
  const hours = Math.floor((total % 86400000) / 3600000);
  const mins = Math.floor((total % 3600000) / 60000);
  const secs = Math.floor((total % 60000) / 1000);
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <section className="home-hero stagger-child">
      <div className="home-hero-content">
        <div>
          <div className="home-eyebrow">Fifa World Cup 2026</div>
          <h1 className="home-title">
            Fotbolls-VM
            <span>2026</span>
          </h1>
        </div>

        <div className="home-countdown" aria-label="Tid kvar till VM">
          <Unit val={days} label="Dag" />
          <Unit val={pad(hours)} label="Tim" />
          <Unit val={pad(mins)} label="Min" />
          <Unit val={pad(secs)} label="Sek" />
        </div>

        <p className="home-hero-copy">
          Tippa alla <strong>72 gruppspelsmatcher</strong>, rangordna hur{' '}
          <strong>grupperna slutar</strong> och vilka som <strong>vinner VM</strong>.
        </p>
      </div>

      <Link to="/mina-tips" className="home-primary-cta">
        Börja tippa nu
      </Link>
    </section>
  );
}

function Unit({ val, label }) {
  return (
    <div className="home-count-unit">
      <div className="home-count-value">{val}</div>
      <div className="home-count-label">{label}</div>
    </div>
  );
}

function StatusPill({ children, tone = 'muted' }) {
  return <span className={clsx('home-status-pill', tone)}>{children}</span>;
}

function ChecklistCard({ matchCount, totalMatches, rankedGroups, totalGroups, winnerSelected }) {
  return (
    <section className="home-card stagger-child">
      <div className="home-card-header">
        <div>
          <h2>Checklista</h2>
          <p>Har du tippat klart allt?</p>
        </div>
        <div className="home-icon-well">
          <img src={checklistIcon} alt="" />
        </div>
      </div>

      <div className="home-list">
        <Link to="/mina-tips?tab=vinnare" className="home-list-row">
          <div>
            <h3>01. Din vinnare</h3>
            <p>Vilket lag vinner VM?</p>
          </div>
          <StatusPill tone={winnerSelected ? 'done' : 'muted'}>
            {winnerSelected ? 'Vald' : 'Ej vald'}
          </StatusPill>
        </Link>

        <Link to="/mina-tips" className="home-list-row">
          <div>
            <h3>02. Gruppspelet</h3>
            <p>Tippa resultat och tecken i matcherna</p>
          </div>
          <StatusPill tone={matchCount > 0 ? 'blue' : 'muted'}>
            {matchCount} / {totalMatches}
          </StatusPill>
        </Link>

        <Link to="/mina-tips?tab=grupper" className="home-list-row">
          <div>
            <h3>03. Rangordna lagen</h3>
            <p>Hur slutar grupperna?</p>
          </div>
          <StatusPill tone={rankedGroups > 0 ? 'blue' : 'muted'}>
            {rankedGroups} / {totalGroups}
          </StatusPill>
        </Link>
      </div>

      <div className="home-card-actions">
        <Link to="/mina-tips" className="home-secondary-cta">
          Till tippningen
        </Link>
      </div>
    </section>
  );
}

function NextPredictionCard({ type }) {
  const config = {
    winner: {
      to: '/mina-tips?tab=vinnare',
      icon: winnerIcon,
      title: 'VÄLJ DITT VINNARLAG',
      body: 'Vilket lag tar hem guldet 2026?',
    },
    matches: {
      to: '/mina-tips',
      icon: matchesIcon,
      title: 'TIPPA MATCHERNA',
      body: 'Tippa alla gruppspelsmatcher.',
    },
    groups: {
      to: '/mina-tips?tab=grupper',
      icon: groupsIcon,
      title: 'RANGORDNA LAGEN',
      body: 'Hur slutar grupperna?',
    },
  }[type];

  return (
    <Link to={config.to} className="home-next-card stagger-child">
      <div className="home-next-icon">
        <img src={config.icon} alt="" />
      </div>
      <div>
        <h2>{config.title}</h2>
        <p>{config.body}</p>
      </div>
      <ChevronIcon />
    </Link>
  );
}

function RulesPreviewCard({ onOpen }) {
  return (
    <section className="home-card stagger-child">
      <div className="home-card-header">
        <div>
          <h2>Regler och poäng</h2>
          <p>Om du har några funderingar</p>
        </div>
        <div className="home-icon-well">
          <img src={rulesIcon} alt="" />
        </div>
      </div>

      <div className="home-list">
        <div className="home-list-row no-action">
          <div>
            <h3>Tippa alla 3 delar</h3>
            <p>Matcher, gruppspel, vinnare</p>
          </div>
        </div>
        <div className="home-list-row no-action">
          <div>
            <h3>Deadline</h3>
            <p>Du har till första avspark på dig att göra förändringar</p>
          </div>
        </div>
        <div className="home-list-row no-action">
          <div>
            <h3>Pottens fördelning</h3>
            <p>Topp tre enligt 50/30/20 regeln</p>
          </div>
        </div>
      </div>

      <div className="home-card-actions">
        <button type="button" className="home-secondary-cta" onClick={onOpen}>
          Alla regler och poäng
        </button>
      </div>
    </section>
  );
}

function PreWcHome({
  deadlineMs,
  name,
  matchCount,
  totalMatches,
  rankedGroups,
  totalGroups,
  winnerSelected,
  onOpenRules,
}) {
  const nextType = !winnerSelected
    ? 'winner'
    : matchCount >= totalMatches
      ? 'groups'
      : 'matches';

  return (
    <div className="home-page">
      <PreWcHomeHeader name={name} />
      <PreWcHero deadlineMs={deadlineMs} />
      <ChecklistCard
        matchCount={matchCount}
        totalMatches={totalMatches}
        rankedGroups={rankedGroups}
        totalGroups={totalGroups}
        winnerSelected={winnerSelected}
      />
      <NextPredictionCard type={nextType} />
      <RulesPreviewCard onOpen={onOpenRules} />
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
            <MatchCard
              key={m.id}
              match={m}
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
  const [rulesOpen, setRulesOpen] = useState(false);

  const deadlineMs = globalDeadline
    ? new Date(globalDeadline).getTime() - now
    : null;
  const tournamentStarted = groupLocked || (deadlineMs != null && deadlineMs <= 0);

  const predicted = predictions ? Object.keys(predictions.matches || {}).length : 0;
  const totalMatches = TOTAL_GROUP_MATCHES;
  const rankedGroups = predictions
    ? Object.values(predictions.groupStandings || {}).filter((arr) => arr.length === 4).length
    : 0;
  const winnerSelected = Boolean(predictions?.knockout?.FINAL);
  const myEntry = entries.find((e) => e.userId === myUserId);
  const sortedEntries = [...entries].sort((a, b) => b.points - a.points);
  const myRank = sortedEntries.findIndex((e) => e.userId === myUserId);

  // All matches in the same order they're shown on the page (group A→L,
  // kickoff within each group). The bottom-sheet arrows walk this list so
  // navigation matches the visible list order.
  const orderedMatches = useMemo(() => flattenMatchesByGroup(matches), [matches]);

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
    <div className="mx-auto max-w-3xl">
      {tournamentStarted ? (
        <div className="space-y-4">
          <PageHeader title="VM 2026" subtitle="Gruppspel · pågående" />
          <LiveView
            matches={matches}
            now={now}
            predictions={predictions}
            onPredict={(m) => setPredictMatch(m)}
            myEntry={myEntry}
            myRank={myRank}
            totalPlayers={entries.length}
          />
        </div>
      ) : (
        <PreWcHome
          deadlineMs={deadlineMs}
          name={myName}
          matchCount={predicted}
          totalMatches={totalMatches}
          rankedGroups={rankedGroups}
          totalGroups={12}
          winnerSelected={winnerSelected}
          onOpenRules={() => setRulesOpen(true)}
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
      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
