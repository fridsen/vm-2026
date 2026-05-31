import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import clsx from 'clsx';
import { getTeamById } from '../data/teams.js';
import { useMatchOdds } from '../hooks/useMatchOdds.js';

function Stepper({ value, onChange, disabled }) {
  const stepperBtnClass =
    'flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.07] bg-pitch-50 text-lg text-neutral-600 transition-colors active:border-accent active:bg-accent active:text-accent-foreground disabled:opacity-30';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        disabled={disabled || value >= 99}
        onClick={() => onChange(value + 1)}
        className={stepperBtnClass}
        aria-label="Plus"
      >
        +
      </button>
      <div className="min-w-[36px] text-center font-display text-5xl leading-none text-neutral-900">
        {value}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Math.max(0, value - 1))}
        className={stepperBtnClass}
        aria-label="Minus"
      >
        −
      </button>
    </div>
  );
}

function OutcomeButton({ symbol, label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-2xl border px-2 py-3.5 transition-colors',
        selected
          ? 'border-accent bg-accent'
          : 'border-black/[0.06] bg-pitch-50 hover:bg-pitch-100'
      )}
    >
      <span
        className={clsx(
          'font-display text-[26px] leading-none tracking-wide',
          selected ? 'text-accent-foreground' : 'text-neutral-500'
        )}
      >
        {symbol}
      </span>
      <span
        className={clsx(
          'text-[10px] font-semibold uppercase tracking-wider',
          selected ? 'text-white/55' : 'text-neutral-400'
        )}
      >
        {label}
      </span>
    </button>
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
  // change the score steppers and changing the score does NOT change the
  // pick. If the user hasn't picked anything, the outcome chip is still
  // derived from the score (visual hint only).
  const [outcomePick, setOutcomePick] = useState(prediction?.outcome ?? null);

  useEffect(() => {
    setHome(prediction?.home ?? 0);
    setAway(prediction?.away ?? 0);
    setOutcomePick(prediction?.outcome ?? null);
  }, [prediction, match?.id]);

  // Auto-save the current pick before navigating to the prev/next match —
  // only if the user has actually picked a tecken (the required field).
  const navigate = (direction) => {
    if (!disabled && outcomePick) {
      onSave?.({ home, away, outcome: outcomePick });
    }
    if (direction === 'prev') onPrev?.();
    else onNext?.();
  };

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (!match) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [match]);

  const homeTeam = match ? getTeamById(match.homeTeamId) : null;
  const awayTeam = match ? getTeamById(match.awayTeamId) : null;
  const ai = useMatchOdds(homeTeam, awayTeam, {
    group: match?.group,
    round: match?.round,
  });

  if (!match) return null;

  const kickoff = new Date(match.kickoff);

  // Tecken is a required, explicit pick — nothing is selected until the
  // user taps one. It is never derived from the score; the two inputs are
  // fully independent (e.g. score 2-2 with tecken "1" is allowed).
  const outcome = outcomePick;
  // Tap an unselected pick to choose it; tap the current pick to clear it.
  const setOutcome = (next) => {
    setOutcomePick((prev) => (prev === next ? null : next));
  };

  return (
    <div
      className="sheet-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="sheet-slide-up relative w-full max-w-[420px] overflow-hidden rounded-t-[28px] border-t border-black/[0.06] bg-surface px-6 pb-10 pt-6 shadow-[0_-4px_40px_rgba(0,0,0,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/10" />

        <div className="mb-4 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Grupp {match.group} · Rund {match.round}
          </div>
          <div className="text-[11px] font-semibold text-neutral-500">
            {format(kickoff, "d MMM 'kl.' HH:mm", { locale: sv })}
          </div>
        </div>

        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex min-w-0 flex-col items-center gap-1">
            <div className="text-[38px] leading-none">{homeTeam?.flag}</div>
            <div className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              {homeTeam?.code}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center gap-2.5">
            <Stepper value={home} onChange={setHome} disabled={disabled} />
            <span className="font-display text-2xl tracking-wide text-neutral-300">:</span>
            <Stepper value={away} onChange={setAway} disabled={disabled} />
          </div>
          <div className="flex min-w-0 flex-col items-center gap-1">
            <div className="text-[38px] leading-none">{awayTeam?.flag}</div>
            <div className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              {awayTeam?.code}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500">
            Tecken
          </div>
          <div className="flex gap-2.5">
            <OutcomeButton
              symbol="1"
              label={homeTeam?.code || 'Hemma'}
              selected={outcome === '1'}
              onClick={() => setOutcome('1')}
            />
            <OutcomeButton
              symbol="X"
              label="Oavgjort"
              selected={outcome === 'X'}
              onClick={() => setOutcome('X')}
            />
            <OutcomeButton
              symbol="2"
              label={awayTeam?.code || 'Borta'}
              selected={outcome === '2'}
              onClick={() => setOutcome('2')}
            />
          </div>
        </div>

        {ai.blurb && (
          <div className="ai-card">
            {ai.analysisLoading && (
              <div className="ai-card-header">
                <div className="ai-dot" />
                <div className="ai-label">AI analyserar matchen…</div>
              </div>
            )}
            <div
              className={clsx(
                'ai-text transition-opacity duration-300',
                ai.analysisLoading && 'opacity-60',
              )}
            >
              {ai.blurb}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('prev')}
            disabled={!hasPrev}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-black/[0.07] bg-pitch-50 text-xl text-neutral-600 transition-colors active:bg-accent active:text-accent-foreground disabled:cursor-default disabled:opacity-25"
            aria-label="Föregående match"
          >
            ←
          </button>
          <button
            type="button"
            disabled={disabled || !outcomePick}
            onClick={() => {
              onSave?.({ home, away, outcome: outcomePick });
              onClose?.();
            }}
            className="flex-1 rounded-2xl bg-accent px-4 py-4 font-display text-lg uppercase tracking-[0.10em] text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ boxShadow: '0 4px 20px rgba(12,12,20,0.20)' }}
          >
            Spara tippning
          </button>
          <button
            type="button"
            onClick={() => navigate('next')}
            disabled={!hasNext}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-black/[0.07] bg-pitch-50 text-xl text-neutral-600 transition-colors active:bg-accent active:text-accent-foreground disabled:cursor-default disabled:opacity-25"
            aria-label="Nästa match"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
