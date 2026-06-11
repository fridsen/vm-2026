import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAllMatches } from '../hooks/useMatches.js';
import { useLockState } from '../hooks/useLockState.js';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import { usePredictions } from '../hooks/usePredictions.js';
import { useAuth } from '../hooks/useAuth.js';
import { flattenMatchesByGroup } from '../utils/matchSchedule.js';
import LiveDashboard from '../components/live/LiveDashboard.jsx';
import PredictionSheet from '../components/PredictionSheet.jsx';
import RulesSheet from '../components/RulesSheet.jsx';
import SwishPaymentPrompt from '../components/SwishPaymentPrompt.jsx';
import { usePayments } from '../hooks/usePayments.js';
import { formatPrizePayoutPcts } from '../services/paymentsService.js';
import checklistIcon from '../assets/home/checklist-icon.svg';
import rulesIcon from '../assets/home/rules-icon.svg';
import matchesIcon from '../assets/mina-tips/matches-icon.svg';
import groupsIcon from '../assets/mina-tips/groups-icon.svg';
import winnerIcon from '../assets/mina-tips/winner-icon.svg';
import { countTopThreeFilled, getTopThree } from '../utils/topThree.js';
import { getTippingProgress } from '../utils/tippingProgress.js';
import NewsFeedCard from '../components/NewsFeedCard.jsx';
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

function StatusPill({ children, tone = 'empty' }) {
  return <span className={clsx('home-status-pill', tone)}>{children}</span>;
}

function progressPillTone(current, total) {
  if (current === 0) return 'empty';
  if (current >= total) return 'done';
  return 'progress';
}

function ChecklistCard({
  matchCount,
  totalMatches,
  rankedGroups,
  totalGroups,
  topThreeFilled,
}) {
  return (
    <section className="home-card home-card-widget stagger-child">
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
        <Link to="/mina-tips" className="home-list-row">
          <div>
            <h3>01. Gruppspelet</h3>
            <p>Tippa resultat och tecken i matcherna</p>
          </div>
          <StatusPill tone={progressPillTone(matchCount, totalMatches)}>
            {matchCount} / {totalMatches}
          </StatusPill>
        </Link>

        <Link to="/mina-tips?tab=grupper" className="home-list-row">
          <div>
            <h3>02. Rangordna lagen</h3>
            <p>Hur slutar grupperna</p>
          </div>
          <StatusPill tone={progressPillTone(rankedGroups, totalGroups)}>
            {rankedGroups} / {totalGroups}
          </StatusPill>
        </Link>

        <Link to="/mina-tips?tab=vinnare" className="home-list-row">
          <div>
            <h3>03. Topp 3 i VM</h3>
            <p>Vilka tar hem medaljerna?</p>
          </div>
          <StatusPill tone={progressPillTone(topThreeFilled, 3)}>
            {topThreeFilled} / 3
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
    <section className="home-card home-card-widget stagger-child">
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
            <p>Matcher, grupper & topp 3</p>
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
            <p>Topp fem enligt {formatPrizePayoutPcts()} regeln</p>
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
    matchCount < totalMatches
      ? 'matches'
      : rankedGroups < totalGroups
        ? 'groups'
        : topThreeFilled < 3
          ? 'winner'
          : null;
  const hasStartedTipping =
    topThreeFilled > 0 || matchCount > 0 || rankedGroups > 0;
  const { matchesDone, groupsDone, topThreeDone } = getTippingProgress({
    matchCount,
    totalMatches,
    rankedGroups,
    totalGroups,
    topThreeFilled,
  });
  const tippingComplete = matchesDone && groupsDone && topThreeDone;

  return (
    <div className="home-page">
      <PreWcHero deadlineMs={deadlineMs} hasStartedTipping={hasStartedTipping} />
      {showSwishPrompt && <SwishPaymentPrompt firstName={firstName} />}
      {!tippingComplete && (
        <>
          <ChecklistCard
            matchCount={matchCount}
            totalMatches={totalMatches}
            rankedGroups={rankedGroups}
            totalGroups={totalGroups}
            topThreeFilled={topThreeFilled}
          />
          {nextType ? <NextPredictionCard type={nextType} /> : null}
        </>
      )}
      <RulesPreviewCard onOpen={onOpenRules} />
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
    <>
      {tournamentStarted ? (
        <LiveDashboard
          matches={matches}
          now={now}
          predictions={predictions}
          entries={entries}
          myUserId={myUserId}
          myEntry={myEntry}
          newsArticles={newsArticles}
          newsLoading={newsLoading}
        />
      ) : (
        <PreWcHome
          deadlineMs={deadlineMs}
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
    </>
  );
}
