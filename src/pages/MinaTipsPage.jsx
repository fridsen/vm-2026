import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { useAllMatches } from '../hooks/useMatches.js';
import { useLockState } from '../hooks/useLockState.js';
import { usePredictions } from '../hooks/usePredictions.js';
import { useTeams } from '../hooks/useTeams.js';
import { GROUPS } from '../data/teams.js';
import { flagImageForCode } from '../data/flagImages.js';
import { flattenMatchesByGroup } from '../utils/matchSchedule.js';
import PredictionSheet from '../components/PredictionSheet.jsx';
import RulesSheet from '../components/RulesSheet.jsx';
import MinaTipsIntroModal from '../components/MinaTipsIntroModal.jsx';
import MinaTipsOnboarding, {
  MINA_TIPS_ONBOARDING_SEEN_KEY,
  shouldShowMinaTipsOnboarding,
} from '../components/MinaTipsOnboarding.jsx';
import matchesIcon from '../assets/mina-tips/matches-icon.svg';
import groupsIcon from '../assets/mina-tips/groups-icon.svg';
import winnerIcon from '../assets/mina-tips/winner-icon.svg';
import helpIcon from '../assets/mina-tips/help-icon.svg';

const MINA_TIPS_INTRO_SEEN_KEY = 'vm2026:minaTipsIntroSeen:v1';

function TipsLockBanner({ locked }) {
  if (!locked) return null;
  return (
    <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-center text-sm text-amber-800">
      Tippningen är låst sedan första gruppspelsmatchen startade.
    </div>
  );
}

function shouldShowMinaTipsIntro() {
  try {
    return window.localStorage?.getItem(MINA_TIPS_INTRO_SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

// ─── Circular progress badge ──────────────────────────────────────────────────

function CircularProgress({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const done = pct >= 100;
  const r = 17;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
      <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
        <circle
          cx="20" cy="20" r={r}
          fill="none"
          stroke={done ? '#22c55e' : '#e5e7eb'}
          strokeWidth="4"
        />
        {pct > 0 && (
          <circle
            cx="20" cy="20" r={r}
            fill="none"
            stroke={done ? '#22c55e' : '#22c55e'}
            strokeWidth="4"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        )}
      </svg>
      <span
        className={clsx(
          'absolute text-[10px] font-bold tabular-nums',
          done ? 'text-green-500' : 'text-neutral-500',
        )}
      >
        {pct}
      </span>
    </div>
  );
}

// ─── Infobox ──────────────────────────────────────────────────────────────────

function Infobox({ icon, title, body, value, max }) {
  return (
    <div className="mina-infobox">
      <div className="mina-infobox-icon">
        {icon}
      </div>
      <div className="mina-infobox-copy">
        <div className="mina-infobox-title">
          {title}
        </div>
        <div className="mina-infobox-body">{body}</div>
      </div>
      <CircularProgress value={value} max={max} />
    </div>
  );
}

// ─── Segmented control ────────────────────────────────────────────────────────

const TABS = [
  { id: 'matcher', label: 'Matcher' },
  { id: 'grupper', label: 'Grupper' },
  { id: 'vinnare', label: 'Vinnare' },
];

function SegmentBadge({ status }) {
  if (!status) return null;
  if (status.done) {
    return (
      <span className="mina-segmented-badge is-done" aria-label="Klar">
        <svg viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path
            d="M2 5.1 4.1 7.2 8 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span className={clsx('mina-segmented-badge', status.active ? 'is-active' : 'is-idle')}>
      {status.count}
    </span>
  );
}

function SegmentedControl({ value, onChange, statuses }) {
  const activeIndex = Math.max(0, TABS.findIndex((tab) => tab.id === value));

  return (
    <div
      className="mina-segmented"
      role="tablist"
      aria-label="Mina tips"
      style={{
        '--segment-count': TABS.length,
        '--segment-index': activeIndex,
      }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          data-onboarding-target={`mina-tab-${tab.id}`}
          onClick={() => onChange(tab.id)}
          role="tab"
          aria-selected={value === tab.id}
          className={clsx(
            'mina-segmented-tab',
            value === tab.id && 'active',
          )}
        >
          <span>{tab.label}</span>
          <SegmentBadge status={statuses?.[tab.id]} />
        </button>
      ))}
    </div>
  );
}

function StatusLegend() {
  return (
    <div className="mina-status-legend" aria-label="Statusförklaring">
      <span>
        <i className="is-idle" />
        Ej startat
      </span>
      <span>
        <i className="is-active" />
        Pågående
      </span>
      <span>
        <i className="is-done" />
        Klar
      </span>
    </div>
  );
}

// ─── Matcher tab ──────────────────────────────────────────────────────────────

function MatchPredictionValue({ prediction }) {
  if (!prediction) return null;
  const outcome =
    prediction.outcome ||
    (prediction.home > prediction.away ? '1' : prediction.home === prediction.away ? 'X' : '2');

  return (
    <span className="mina-match-prediction">
      {prediction.home}-{prediction.away} ({outcome})
    </span>
  );
}

function MinaMatchRow({ match, prediction, onPredict }) {
  const { getTeamById } = useTeams();
  const home = getTeamById(match.homeTeamId);
  const away = getTeamById(match.awayTeamId);
  const homeFlag = flagImageForCode(home?.code || home?.id);
  const awayFlag = flagImageForCode(away?.code || away?.id);

  return (
    <button type="button" className="mina-match-row" onClick={onPredict}>
      <span className="mina-match-teams">
        <span className="mina-match-team">
          <span className="mina-match-flag" aria-hidden>
            {homeFlag ? <img src={homeFlag} alt="" /> : (home?.flag ?? '🏳')}
          </span>
          <span>{home?.name ?? 'TBD'}</span>
        </span>
        <span className="mina-match-vs">vs</span>
        <span className="mina-match-team">
          <span className="mina-match-flag" aria-hidden>
            {awayFlag ? <img src={awayFlag} alt="" /> : (away?.flag ?? '🏳')}
          </span>
          <span>{away?.name ?? 'TBD'}</span>
        </span>
      </span>
      {prediction ? (
        <MatchPredictionValue prediction={prediction} />
      ) : (
        <span className="mina-match-cta">Tippa</span>
      )}
    </button>
  );
}

function MatcherTab({ matches, predictions, updateMatch, tournamentLocked }) {
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

  const orderedMatches = useMemo(() => flattenMatchesByGroup(matches), [matches]);
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
      <div className="mina-stack">
        {GROUPS.map((g) => {
          const games = matchesByGroup[g] || [];
          if (games.length === 0) return null;
          const predicted = games.filter((m) => predictions?.matches?.[m.id]).length;
          const allDone = predicted === games.length;
          return (
            <section key={g} className="mina-card">
              <div className="mina-card-title">
                <span>GRUPP {g}</span>
                <span className={allDone ? 'is-complete' : ''}>
                  {allDone ? 'KLAR' : `${predicted} / ${games.length}`}
                </span>
              </div>
              {games.map((m) => (
                <MinaMatchRow
                  key={m.id}
                  match={m}
                  prediction={predictions?.matches?.[m.id]}
                  onPredict={tournamentLocked ? undefined : () => setPredictMatch(m)}
                />
              ))}
            </section>
          );
        })}
      </div>

      <PredictionSheet
        match={predictMatch}
        prediction={predictMatch ? predictions?.matches?.[predictMatch.id] : null}
        disabled={tournamentLocked}
        onClose={() => setPredictMatch(null)}
        onSave={({ home, away, outcome }) => {
          if (predictMatch) updateMatch(predictMatch.id, { home, away, outcome });
        }}
        hasPrev={!!prevMatch}
        hasNext={!!nextMatch}
        onPrev={() => prevMatch && setPredictMatch(prevMatch)}
        onNext={() => nextMatch && setPredictMatch(nextMatch)}
      />
    </>
  );
}

// ─── Grupper tab ──────────────────────────────────────────────────────────────

const RANK_COLORS = [
  'rank-gold',
  'rank-silver',
  'rank-bronze',
  'rank-fourth',
];

function GroupRankCard({ group, matches, groupStandings, onToggleRank, tournamentLocked }) {
  const { getTeamsInGroup } = useTeams();
  const allTeams = useMemo(() => getTeamsInGroup(group, matches), [getTeamsInGroup, group, matches]);

  const ranked = groupStandings || [];
  const unranked = allTeams
    .filter((t) => !ranked.includes(t.id))
    .map((t) => t.id);

  const orderedIds = [...ranked, ...unranked];
  const allDone = ranked.length === allTeams.length && allTeams.length > 0;

  return (
    <div className="mina-card">
      <div className="mina-card-title">
        <span>GRUPP {group}</span>
        <span className={allDone ? 'is-complete' : ''}>
          {allDone ? 'KLAR' : `${ranked.length} / ${allTeams.length}`}
        </span>
      </div>
      <div>
        {orderedIds.map((teamId) => {
          const rankIdx = ranked.indexOf(teamId);
          const isRanked = rankIdx !== -1;
          const team = allTeams.find((t) => t.id === teamId);
          const flagImage = flagImageForCode(team?.code || team?.id);
          if (!team) return null;
          return (
            <button
              key={teamId}
              type="button"
              disabled={tournamentLocked}
              onClick={() => onToggleRank(group, teamId, allTeams.map((t) => t.id))}
              className={clsx(
                'mina-rank-row',
                isRanked && RANK_COLORS[rankIdx],
              )}
            >
              <span
                className={clsx(
                  'mina-rank-badge',
                  isRanked && RANK_COLORS[rankIdx],
                )}
              >
                {isRanked ? rankIdx + 1 : '–'}
              </span>
              <span className="mina-rank-flag" aria-hidden>
                {flagImage ? <img src={flagImage} alt="" /> : team.flag}
              </span>
              <span
                className={clsx(
                  'mina-rank-team',
                  rankIdx === 3 && 'is-fourth',
                )}
              >
                {team.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GrupperTab({ matches, predictions, updateGroupStanding, tournamentLocked }) {
  function handleToggleRank(group, teamId, allTeamIds) {
    if (tournamentLocked) return;
    const current = predictions?.groupStandings?.[group] || [];
    let next;
    if (current.includes(teamId)) {
      next = current.filter((id) => id !== teamId);
    } else {
      next = [...current, teamId];
      if (next.length === allTeamIds.length - 1) {
        const lastUnranked = allTeamIds.find((id) => !next.includes(id));
        if (lastUnranked) next = [...next, lastUnranked];
      }
    }
    updateGroupStanding(group, next);
  }

  return (
    <div className="mina-stack">
      <TipsLockBanner locked={tournamentLocked} />
      {GROUPS.map((g) => (
        <GroupRankCard
          key={g}
          group={g}
          matches={matches}
          groupStandings={predictions?.groupStandings?.[g] || []}
          onToggleRank={handleToggleRank}
          tournamentLocked={tournamentLocked}
        />
      ))}
    </div>
  );
}

// ─── Vinnare tab ──────────────────────────────────────────────────────────────

function VinnareTab({ predictions, updateWinner, tournamentLocked }) {
  const scrollRef = useRef(null);
  const { teams } = useTeams();
  const currentWinner = predictions?.knockout?.FINAL ?? null;

  const sortedTeams = useMemo(() => {
    const alphabetical = [...teams].sort((a, b) => a.name.localeCompare(b.name, 'sv'));
    if (!currentWinner) return alphabetical;
    const winner = alphabetical.find((t) => t.id === currentWinner);
    if (!winner) return alphabetical;
    return [winner, ...alphabetical.filter((t) => t.id !== currentWinner)];
  }, [teams, currentWinner]);

  function handleSelect(teamId) {
    if (tournamentLocked) return;
    if (teamId === currentWinner) {
      updateWinner(null);
    } else {
      updateWinner(teamId);
      // Scroll to top so the selected team (now at position 0) is visible
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  return (
    <div ref={scrollRef} className="mina-card">
      <TipsLockBanner locked={tournamentLocked} />
      <div>
        {sortedTeams.map((team) => {
          const selected = team.id === currentWinner;
          return (
            <button
              key={team.id}
              type="button"
              disabled={tournamentLocked}
              onClick={() => handleSelect(team.id)}
              className={clsx(
                'mina-winner-row',
                selected && 'is-selected',
              )}
            >
              <span className="mina-match-flag" aria-hidden>
                {team.flag}
              </span>
              <span
                className={clsx(
                  'mina-winner-team',
                  selected ? 'text-green-700' : 'text-neutral-900',
                )}
              >
                {team.name}
              </span>
              <span
                className={clsx(
                  'mina-winner-radio',
                  selected
                    ? 'is-selected'
                    : '',
                )}
              >
                {selected && (
                  <svg viewBox="0 0 10 10" className="h-3 w-3" fill="none">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MinaTipsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = TABS.some((item) => item.id === tabParam) ? tabParam : 'matcher';
  const [rulesOpen, setRulesOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(shouldShowMinaTipsIntro);
  const [onboardingOpen, setOnboardingOpen] = useState(
    () => !shouldShowMinaTipsIntro() && shouldShowMinaTipsOnboarding(),
  );
  const { matches, loading: matchesLoading } = useAllMatches();
  const { tournamentLocked } = useLockState();
  const { predictions, updateMatch, updateGroupStanding, updateWinner } = usePredictions();

  const matchCount = predictions ? Object.keys(predictions.matches || {}).length : 0;
  const totalMatches = matches.length || 72;
  const groupCount = predictions
    ? Object.values(predictions.groupStandings || {}).filter((arr) => arr.length === 4).length
    : 0;
  const totalGroups = GROUPS.length;
  const winner = predictions?.knockout?.FINAL ?? null;
  const tabStatuses = {
    matcher: {
      count: Math.max(0, totalMatches - matchCount),
      active: matchCount > 0,
      done: matchCount >= totalMatches && totalMatches > 0,
    },
    grupper: {
      count: Math.max(0, totalGroups - groupCount),
      active: groupCount > 0,
      done: groupCount >= totalGroups && totalGroups > 0,
    },
    vinnare: {
      count: 1,
      active: false,
      done: Boolean(winner),
    },
  };

  const infoboxProps = {
    matcher: {
      icon: <img src={matchesIcon} alt="" />,
      title: 'TIPPA MATCHERNA',
      body: (
        <>
          Tippa <strong>alla matcher</strong> i gruppspelet
        </>
      ),
      value: matchCount,
      max: totalMatches,
    },
    grupper: {
      icon: <img src={groupsIcon} alt="" />,
      title: 'TIPPA PLACERING',
      body: 'Rangordna lagen 1–4 per grupp.',
      value: groupCount,
      max: totalGroups,
    },
    vinnare: {
      icon: <img src={winnerIcon} alt="" />,
      title: 'VÄLJ DITT VINNARLAG',
      body: 'Vilket lag tar hem guldet 2026?',
      value: winner ? 1 : 0,
      max: 1,
    },
  }[tab];

  function handleTabChange(nextTab) {
    setSearchParams(nextTab === 'matcher' ? {} : { tab: nextTab }, { replace: true });
  }

  function handleIntroClose() {
    try {
      window.localStorage?.setItem(MINA_TIPS_INTRO_SEEN_KEY, '1');
    } catch {
      /* ignore unavailable storage */
    }
    setIntroOpen(false);
    if (shouldShowMinaTipsOnboarding()) {
      setOnboardingOpen(true);
    }
  }

  function handleOnboardingComplete() {
    try {
      window.localStorage?.setItem(MINA_TIPS_ONBOARDING_SEEN_KEY, '1');
    } catch {
      /* ignore unavailable storage */
    }
    setOnboardingOpen(false);
  }

  return (
    <div className="mina-page tab-page-enter">
      {/* Hero */}
      <header className="mina-hero">
        <div className="mina-hero-copy">
          <h1>
            Dina Tips
          </h1>
          <p>
            Alla dina tips samlade på ett ställe
          </p>
        </div>
        <button
          type="button"
          aria-label="Hjälp"
          onClick={() => setRulesOpen(true)}
          className="mina-help-button"
        >
          <img src={helpIcon} alt="" />
        </button>
      </header>

      <SegmentedControl value={tab} onChange={handleTabChange} statuses={tabStatuses} />

      <StatusLegend />

      <Infobox {...infoboxProps} />

      {matchesLoading ? (
        <div className="card p-8 text-center text-neutral-400">Laddar…</div>
      ) : (
        <>
          <TipsLockBanner locked={tournamentLocked && tab === 'matcher'} />
          {tab === 'matcher' && (
            <MatcherTab
              matches={matches}
              predictions={predictions}
              updateMatch={updateMatch}
              tournamentLocked={tournamentLocked}
            />
          )}
          {tab === 'grupper' && (
            <GrupperTab
              matches={matches}
              predictions={predictions}
              updateGroupStanding={updateGroupStanding}
              tournamentLocked={tournamentLocked}
            />
          )}
          {tab === 'vinnare' && (
            <VinnareTab
              predictions={predictions}
              updateWinner={updateWinner}
              tournamentLocked={tournamentLocked}
            />
          )}
        </>
      )}
      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <MinaTipsIntroModal open={introOpen} onClose={handleIntroClose} />
      <MinaTipsOnboarding
        open={onboardingOpen && !introOpen}
        onStepTab={handleTabChange}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
