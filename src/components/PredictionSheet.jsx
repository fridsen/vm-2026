import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import clsx from 'clsx';
import { useTeams } from '../hooks/useTeams.js';
import { useMatchAnalysis } from '../hooks/useMatchAnalysis.js';
import { emblemForCode } from '../data/emblems.js';
import { haptics } from '../utils/haptics.js';
import BottomSheet from './BottomSheet.jsx';
import { hasCompletedAppOnboarding } from './AppOnboarding.jsx';
import PredictionSheetOnboarding, {
  PREDICTION_SHEET_ONBOARDING_DELAY_MS,
  PREDICTION_SHEET_ONBOARDING_SEEN_KEY,
  shouldShowPredictionSheetOnboarding,
} from './PredictionSheetOnboarding.jsx';

const SHEET_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const noop = () => {};

function ArrowLeftIcon({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M6.5 2.5 1 8l5.5 5.5M1 8h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TeamEmblem({ team }) {
  const url = team ? emblemForCode(team.code) : null;
  return (
    <div className="flex h-[60px] w-[60px] items-center justify-center">
      {url ? (
        <img
          src={url}
          alt={team?.code || ''}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="text-[40px] leading-none">{team?.flag}</span>
      )}
    </div>
  );
}

// Team name that shrinks its font size to fit the fixed-width box on one
// line instead of truncating. Steps down from 22px to a 12px floor, and
// re-measures once the Bebas Neue webfont has loaded (metrics change).
function TeamName({ children }) {
  const ref = useRef(null);
  const [size, setSize] = useState(20);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const MAX = 20;
    const MIN = 12;
    const fit = () => {
      let s = MAX;
      el.style.fontSize = `${s}px`;
      while (s > MIN && el.scrollWidth > el.clientWidth) {
        s -= 1;
        el.style.fontSize = `${s}px`;
      }
      setSize(s);
    };

    fit();

    let cancelled = false;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) fit();
      });
    }
    return () => {
      cancelled = true;
    };
  }, [children]);

  return (
    <span
      ref={ref}
      style={{ fontSize: `${size}px` }}
      className="prediction-team-name block w-[120px] overflow-hidden whitespace-nowrap text-center font-display uppercase leading-tight tracking-[0.8px] text-ink"
    >
      {children}
    </span>
  );
}

function ScoreStepper({ value, onChange, disabled }) {
  const btn =
    'flex h-10 w-10 items-center justify-center rounded-lg bg-[#eff0f9] pb-[5px] pt-1 font-barlow text-2xl leading-none text-ink transition-colors disabled:opacity-30';
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          haptics.selection();
          onChange(Math.max(0, value - 1));
        }}
        className={btn}
        aria-label="Minus"
      >
        −
      </button>
      <button
        type="button"
        disabled={disabled || value >= 99}
        onClick={() => {
          haptics.selection();
          onChange(value + 1);
        }}
        className={btn}
        aria-label="Plus"
      >
        +
      </button>
    </div>
  );
}

function MarketButton({ symbol, label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex min-h-[68px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-1 py-3 text-center transition-colors',
        selected ? 'bg-black' : 'bg-[#eff0f9]'
      )}
    >
      <span
        className={clsx(
          'font-display text-[26px] leading-[26px]',
          selected ? 'text-white' : 'text-ink'
        )}
      >
        {symbol}
      </span>
      <span
        className={clsx(
          'w-full truncate font-barlow text-xs leading-normal',
          selected ? 'text-white/70' : 'text-ink/50'
        )}
      >
        {label}
      </span>
    </button>
  );
}

// The match-specific content (title, score + steppers, 1/X/2 market, analysis).
// Pure-ish: renders from the passed values/handlers, computes its own teams +
// analysis. Reused for the live editable panel and the two static carousel
// panels during a prev/next slide.
function MatchContent({ match, home, away, outcome, onHome, onAway, onOutcome, disabled }) {
  const { getTeamById } = useTeams();
  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  const { blurb } = useMatchAnalysis(homeTeam, awayTeam);
  const kickoff = new Date(match.kickoff);
  const heading = match.group ? `Grupp ${match.group}` : match.round || '';

  return (
    <div className="flex flex-col gap-5">
      {/* ── Prediction card ───────────────────────────────── */}
      <div className="flex flex-col rounded-[20px] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.1)]">
        {/* Title */}
        <div className="flex items-center justify-between border-b-[0.5px] border-[rgba(12,22,42,0.08)] px-4 pb-2.5 pt-3">
          <span className="font-barlow text-xs font-semibold uppercase tracking-[0.72px] text-ink-muted">
            {heading}
          </span>
          <span className="font-barlow text-sm text-ink-muted">
            {format(kickoff, 'd MMMM・HH:mm', { locale: sv })}
          </span>
        </div>

        {/* Score */}
        <div
          data-onboarding-target="prediction-score-steppers"
          className="px-2 pb-3 pt-4"
        >
          <div className="flex items-start justify-center gap-2.5">
            {/* Home team */}
            <div className="flex w-[120px] flex-col items-center gap-2">
              <div className="flex flex-col items-center gap-3">
                <TeamEmblem team={homeTeam} />
                <TeamName>{homeTeam?.name}</TeamName>
              </div>
              <ScoreStepper value={home} onChange={onHome} disabled={disabled} />
            </div>

            {/* Center score */}
            <div className="prediction-score-display flex shrink-0 gap-2 py-[29px] font-display text-[60px] leading-[60px] text-ink">
              <span className="tabular-nums">{home}</span>
              <span className="tabular-nums">-</span>
              <span className="tabular-nums">{away}</span>
            </div>

            {/* Away team */}
            <div className="flex w-[120px] flex-col items-center gap-2">
              <div className="flex flex-col items-center gap-3">
                <TeamEmblem team={awayTeam} />
                <TeamName>{awayTeam?.name}</TeamName>
              </div>
              <ScoreStepper value={away} onChange={onAway} disabled={disabled} />
            </div>
          </div>
        </div>

        {/* Match result market */}
        <div data-onboarding-target="prediction-market" className="py-3">
          <div className="flex gap-3 px-4 drop-shadow-[0px_4px_8px_rgba(57,61,73,0.08)]">
            <MarketButton
              symbol="1"
              label={homeTeam?.name || 'Hemma'}
              selected={outcome === '1'}
              onClick={() => onOutcome('1')}
            />
            <MarketButton
              symbol="X"
              label="Oavgjort"
              selected={outcome === 'X'}
              onClick={() => onOutcome('X')}
            />
            <MarketButton
              symbol="2"
              label={awayTeam?.name || 'Borta'}
              selected={outcome === '2'}
              onClick={() => onOutcome('2')}
            />
          </div>
        </div>
      </div>

      {/* ── Analysis card ─────────────────────────────────── */}
      {blurb && (
        <div className="flex flex-col rounded-2xl bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-2 border-b-[0.5px] border-[rgba(12,22,42,0.08)] px-4 pb-2.5 pt-3">
            <span className="font-barlow text-xs font-semibold uppercase tracking-[0.72px] text-ink-muted">
              Analys
            </span>
          </div>
          <div className="px-4 pb-3 pt-2">
            <p className="font-barlow text-sm leading-[22px] text-ink">{blurb}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PredictionSheet({
  match,
  prediction,
  disabled,
  onSave,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}) {
  // Scores default to a real 0-0 — that itself is a valid prediction the
  // user can save as-is. Picking a tecken alone is also enough to save.
  const [home, setHome] = useState(prediction?.home ?? 0);
  const [away, setAway] = useState(prediction?.away ?? 0);
  // Outcome (1/X/2) is its own independent state — picking it does NOT
  // change the score steppers and changing the score does NOT change the pick.
  const [outcomePick, setOutcomePick] = useState(prediction?.outcome ?? null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [saved, setSaved] = useState(false);
  // Carousel transition between games: { dir, outgoing, incoming } | null.
  const [trans, setTrans] = useState(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [sheetPhase, setSheetPhase] = useState(null);

  const tooltipTimer = useRef(null);
  const savedTimer = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const outPanelRef = useRef(null);
  const inPanelRef = useRef(null);
  const prevProps = useRef(null); // last shown { match, home, away, outcome }
  const navDirRef = useRef('next');

  // Reset per-match state when navigating to a different match. Keyed on the
  // match id (not the prediction identity) so saving — which changes the
  // prediction prop in place — doesn't wipe the transient "saved" message.
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setHome(prediction?.home ?? 0);
      setAway(prediction?.away ?? 0);
      setOutcomePick(prediction?.outcome ?? null);
      setShowTooltip(false);
      setSaved(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id]);

  useEffect(() => {
    if (!match) {
      setOnboardingOpen(false);
      return undefined;
    }
    if (!hasCompletedAppOnboarding() || !shouldShowPredictionSheetOnboarding()) {
      setOnboardingOpen(false);
      return undefined;
    }
    if (sheetPhase !== 'idle') {
      setOnboardingOpen(false);
      return undefined;
    }

    const timer = window.setTimeout(
      () => setOnboardingOpen(true),
      PREDICTION_SHEET_ONBOARDING_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [match?.id, sheetPhase]);

  function handleOnboardingComplete() {
    try {
      window.localStorage?.setItem(PREDICTION_SHEET_ONBOARDING_SEEN_KEY, '1');
    } catch {
      /* ignore unavailable storage */
    }
    setOnboardingOpen(false);
  }

  useEffect(
    () => () => {
      clearTimeout(tooltipTimer.current);
      clearTimeout(savedTimer.current);
    },
    []
  );

  // ── Carousel: detect a match change and capture both panels ──
  useLayoutEffect(() => {
    if (!match) {
      prevProps.current = null;
      return;
    }
    const prev = prevProps.current;
    const snapshot = {
      match,
      home: prediction?.home ?? 0,
      away: prediction?.away ?? 0,
      outcome: prediction?.outcome ?? null,
    };
    prevProps.current = snapshot;
    if (!prev || prev.match.id === match.id) return;
    setTrans({ dir: navDirRef.current, outgoing: prev, incoming: snapshot });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id]);

  // ── Carousel: run the slide + height tween, then collapse ────
  useLayoutEffect(() => {
    if (!trans) return;
    const vp = viewportRef.current;
    const track = trackRef.current;
    const outEl = outPanelRef.current;
    const inEl = inPanelRef.current;
    if (!vp || !track || !outEl || !inEl) {
      setTrans(null);
      return;
    }
    const outH = outEl.offsetHeight;
    const inH = inEl.offsetHeight;
    // For 'next' the track shows [outgoing, incoming] and moves left;
    // for 'prev' it shows [incoming, outgoing] and moves right.
    const startX = trans.dir === 'prev' ? -50 : 0;
    const endX = trans.dir === 'prev' ? 0 : -50;
    track.style.transition = 'none';
    track.style.transform = `translateX(${startX}%)`;
    vp.style.height = `${outH}px`;
    void track.offsetWidth; // reflow so the next change animates
    const raf = requestAnimationFrame(() => {
      track.style.transition = `transform 0.3s ${SHEET_EASE}`;
      vp.style.transition = `height 0.3s ${SHEET_EASE}`;
      track.style.transform = `translateX(${endX}%)`;
      vp.style.height = `${inH}px`;
    });
    const t = setTimeout(() => {
      vp.style.transition = '';
      vp.style.height = 'auto';
      setTrans(null);
    }, 340);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [trans]);

  // Auto-save the current pick before navigating to the prev/next match —
  // only if the user has actually picked a tecken (the required field).
  const navigate = (direction) => {
    haptics.light();
    navDirRef.current = direction;
    if (!disabled && outcomePick) {
      onSave?.({ home, away, outcome: outcomePick });
    }
    if (direction === 'prev') onPrev?.();
    else onNext?.();
  };

  const flashTooltip = () => {
    setShowTooltip(true);
    clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setShowTooltip(false), 3000);
  };

  const handleSubmit = () => {
    if (disabled) return;
    if (!outcomePick) {
      haptics.error();
      flashTooltip();
      return;
    }
    haptics.success();
    onSave?.({ home, away, outcome: outcomePick });
    setSaved(true);
    clearTimeout(savedTimer.current);

    if (hasNext && onNext) {
      // Brief confirmation, then slide to the next match (batch tipping).
      savedTimer.current = setTimeout(() => {
        setSaved(false);
        navDirRef.current = 'next';
        onNext();
      }, 450);
    } else {
      savedTimer.current = setTimeout(() => setSaved(false), 1200);
    }
  };

  if (!match) return null;

  const savedHome = prediction?.home ?? 0;
  const savedAway = prediction?.away ?? 0;
  const savedOutcome = prediction?.outcome ?? null;
  const isPredicted =
    savedOutcome === '1' || savedOutcome === 'X' || savedOutcome === '2';
  const hasChanges =
    home !== savedHome ||
    away !== savedAway ||
    outcomePick !== savedOutcome;
  const canSave =
    !disabled && !!outcomePick && (!isPredicted || hasChanges);
  const submitLabel = saved
    ? 'Tippning sparad!'
    : isPredicted
      ? 'Ändra tippning'
      : 'Spara tippning';

  const setOutcome = (next) => {
    haptics.selection();
    setOutcomePick((prev) => (prev === next ? null : next));
    setShowTooltip(false);
  };

  // Carousel panel ordering for the active transition.
  const transPanels = trans
    ? trans.dir === 'prev'
      ? [
          { key: 'in', snap: trans.incoming, ref: inPanelRef },
          { key: 'out', snap: trans.outgoing, ref: outPanelRef },
        ]
      : [
          { key: 'out', snap: trans.outgoing, ref: outPanelRef },
          { key: 'in', snap: trans.incoming, ref: inPanelRef },
        ]
    : [];

  return (
    <>
    <BottomSheet
      open={!!match}
      onClose={onClose}
      onPhaseChange={setSheetPhase}
      lockDismiss={onboardingOpen}
      padded={false}
      maxWidth="max-w-[390px]"
      bg="sheet"
      overlay={
        onboardingOpen ? (
          <PredictionSheetOnboarding
            open
            onComplete={handleOnboardingComplete}
          />
        ) : null
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-1">
        {/* Match content — single live panel, or a 2-panel slide on nav */}
        <div ref={viewportRef} className={clsx('relative', trans && 'overflow-hidden')}>
          {trans ? (
            <div ref={trackRef} className="flex w-[200%]">
              {transPanels.map(({ key, snap, ref }) => (
                <div key={key} ref={ref} className="w-1/2 shrink-0 pointer-events-none">
                  <MatchContent
                    match={snap.match}
                    home={snap.home}
                    away={snap.away}
                    outcome={snap.outcome}
                    onHome={noop}
                    onAway={noop}
                    onOutcome={noop}
                    disabled={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div key={match.id}>
              <MatchContent
                match={match}
                home={home}
                away={away}
                outcome={outcomePick}
                onHome={setHome}
                onAway={setAway}
                onOutcome={setOutcome}
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>

        {/* ── Submit + navigation (persistent) ────────────────── */}
        <div
          data-onboarding-target="prediction-footer"
          className="flex w-full shrink-0 items-center gap-3 bg-sheet px-4 pb-6 pt-5"
        >
          <button
            type="button"
            onClick={() => navigate('prev')}
            disabled={!hasPrev}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-[rgba(25,55,93,0.05)] bg-white text-ink shadow-[0px_1px_2px_rgba(0,0,0,0.1)] transition-colors disabled:cursor-default disabled:opacity-30"
            aria-label="Föregående match"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>

          <div className="relative flex flex-1 self-stretch">
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 mb-3 w-[199px] -translate-x-1/2">
                <div className="rounded-xl bg-ink px-3 py-2 text-center font-barlow text-sm leading-[18px] text-white">
                  Du måste välja ett tecken innan du kan spara ditt tips
                </div>
                <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] bg-ink" />
              </div>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              className={clsx(
                'flex h-[52px] w-full items-center justify-center rounded-2xl px-4 font-barlow text-base font-semibold text-white transition-colors',
                canSave
                  ? 'bg-black hover:opacity-90'
                  : 'cursor-not-allowed bg-submit-disabled'
              )}
            >
              {submitLabel}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('next')}
            disabled={!hasNext}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-[rgba(25,55,93,0.05)] bg-white text-ink shadow-[0px_1px_2px_rgba(0,0,0,0.1)] transition-colors disabled:cursor-default disabled:opacity-30"
            aria-label="Nästa match"
          >
            <ArrowLeftIcon className="h-4 w-4 rotate-180" />
          </button>
        </div>
    </BottomSheet>
    </>
  );
}
