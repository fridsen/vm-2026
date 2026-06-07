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
import SwishPaymentPrompt from '../components/SwishPaymentPrompt.jsx';
import { usePayments } from '../hooks/usePayments.js';
import checklistIcon from '../assets/home/checklist-icon.svg';
import rulesIcon from '../assets/home/rules-icon.svg';
import matchesIcon from '../assets/mina-tips/matches-icon.svg';
import groupsIcon from '../assets/mina-tips/groups-icon.svg';
import winnerIcon from '../assets/mina-tips/winner-icon.svg';
import { countTopThreeFilled, getTopThree } from '../utils/topThree.js';
import NewsFeedCard from '../components/NewsFeedCard.jsx';
import TippingProgressWidget from '../components/TippingProgressWidget.jsx';
import { useNews } from '../hooks/useNews.js';

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

function PreWcHomeHeader({
  name,
  firstName,
  matchCount,
  totalMatches,
  rankedGroups,
  totalGroups,
  topThreeFilled,
}) {
  const initials = (name || 'Du')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <header className="home-topbar">
      <Link to="/profile" className="home-profile" aria-label="Öppna profil">
        <div className="home-avatar">{initials || 'DU'}</div>
        <div>
          <div className="home-welcome">Välkommen!</div>
          <div className="home-name">{firstName}</div>
        </div>
      </Link>
      <TippingProgressWidget
        matchCount={matchCount}
        totalMatches={totalMatches}
        rankedGroups={rankedGroups}
        totalGroups={totalGroups}
        topThreeFilled={topThreeFilled}
      />
    </header>
  );
}

function PreWcHero({ deadlineMs, hasStartedTipping }) {
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
          <strong>grupperna slutar</strong> och vilka som <strong>blir topp 3</strong>.
        </p>
      </div>

      <Link to="/mina-tips" className="home-primary-cta">
        {hasStartedTipping ? 'Fortsätt tippa' : 'Börja tippa nu'}
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

function ChecklistCard({
  matchCount,
  totalMatches,
  rankedGroups,
  totalGroups,
  topThreeFilled,
}) {
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
            <h3>01. Topp 3 i VM</h3>
            <p>Guld, silver och brons</p>
          </div>
          <StatusPill tone={topThreeFilled >= 3 ? 'done' : topThreeFilled > 0 ? 'blue' : 'muted'}>
            {topThreeFilled >= 3 ? 'Klar' : `${topThreeFilled} / 3`}
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
      title: 'TIPPA TOPP 3 I VM',
      body: 'Välj guld, silver och brons.',
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
            <p>Matcher, grupper, topp 3</p>
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
  firstName,
  matchCount,
  totalMatches,
  rankedGroups,
  totalGroups,
  topThreeFilled,
  onOpenRules,
  showSwishPrompt,
  newsArticles,
  newsLoading,
}) {
  const nextType =
    topThreeFilled < 3
      ? 'winner'
      : matchCount >= totalMatches
        ? 'groups'
        : 'matches';
  const hasStartedTipping =
    topThreeFilled > 0 || matchCount > 0 || rankedGroups > 0;

  return (
    <div className="home-page">
      <PreWcHomeHeader
        name={name}
        firstName={firstName}
        matchCount={matchCount}
        totalMatches={totalMatches}
        rankedGroups={rankedGroups}
        totalGroups={totalGroups}
        topThreeFilled={topThreeFilled}
      />
      <PreWcHero deadlineMs={deadlineMs} hasStartedTipping={hasStartedTipping} />
      {showSwishPrompt && <SwishPaymentPrompt firstName={firstName} />}
      <ChecklistCard
        matchCount={matchCount}
        totalMatches={totalMatches}
        rankedGroups={rankedGroups}
        totalGroups={totalGroups}
        topThreeFilled={topThreeFilled}
      />
      <NextPredictionCard type={nextType} />
      <RulesPreviewCard onOpen={onOpenRules} />
      <NewsFeedCard articles={newsArticles} loading={newsLoading} />
    </div>
  );
}

function LiveView({
  matches,
  now,
  predictions,
  onPredict,
  myEntry,
  myRank,
  totalPlayers,
  newsArticles,
  newsLoading,
}) {
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

      <NewsFeedCard articles={newsArticles} loading={newsLoading} />
    </div>
  );
}

export default function DashboardPage() {
  const { matches } = useAllMatches();
  const { now, globalDeadline, groupLocked } = useLockState();
  const { entries } = useLeaderboard();
  const { predictions, updateMatch } = usePredictions();
  const { user, profile } = useAuth();
  const { myPayment } = usePayments();
  const { articles: newsArticles, loading: newsLoading } = useNews();
  const myUserId = user?.id;
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Du';
  const firstName =
    profile?.first_name?.trim() ||
    displayName.split(/\s+/).filter(Boolean)[0] ||
    'Du';
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
  const topThreeFilled = countTopThreeFilled(getTopThree(predictions));
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
        <div className="space-y-4 pt-7">
          <PageHeader title="VM 2026" subtitle="Gruppspel · pågående" />
          <LiveView
            matches={matches}
            now={now}
            predictions={predictions}
            onPredict={(m) => setPredictMatch(m)}
            myEntry={myEntry}
            myRank={myRank}
            totalPlayers={entries.length}
            newsArticles={newsArticles}
            newsLoading={newsLoading}
          />
        </div>
      ) : (
        <PreWcHome
          deadlineMs={deadlineMs}
          name={displayName}
          firstName={firstName}
          matchCount={predicted}
          totalMatches={totalMatches}
          rankedGroups={rankedGroups}
          totalGroups={12}
          topThreeFilled={topThreeFilled}
          onOpenRules={() => setRulesOpen(true)}
          showSwishPrompt={!myPayment?.paid}
          newsArticles={newsArticles}
          newsLoading={newsLoading}
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
