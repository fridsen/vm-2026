import clsx from 'clsx';
import { signFromScore } from '../utils/signFromScore.js';

const SIGN_STYLES = {
  1: 'bg-accent text-accent-foreground',
  X: 'bg-amber-500 text-white',
  2: 'bg-rose-500 text-white',
};

export default function ScoreInput({
  home,
  away,
  onChange,
  disabled = false,
  compact = false,
}) {
  const sign = signFromScore(home, away);

  const handleHome = (e) => {
    const v = e.target.value;
    onChange?.({
      home: v === '' ? '' : Math.max(0, Math.min(99, Number(v))),
      away,
    });
  };
  const handleAway = (e) => {
    const v = e.target.value;
    onChange?.({
      home,
      away: v === '' ? '' : Math.max(0, Math.min(99, Number(v))),
    });
  };

  const inputClass = clsx(
    'w-12 rounded-2xl border border-neutral-200 bg-neutral-100 text-center font-bold text-neutral-900 tabular-nums shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:bg-neutral-200 disabled:text-neutral-500',
    compact ? 'h-10 text-base' : 'h-12 text-xl'
  );

  return (
    <div className={clsx('flex items-center gap-1.5', compact && 'gap-1')}>
      <input
        type="number"
        min="0"
        max="99"
        inputMode="numeric"
        className={inputClass}
        value={home ?? ''}
        onChange={handleHome}
        disabled={disabled}
        aria-label="Hemmamål"
      />
      <span className="text-neutral-400">:</span>
      <input
        type="number"
        min="0"
        max="99"
        inputMode="numeric"
        className={inputClass}
        value={away ?? ''}
        onChange={handleAway}
        disabled={disabled}
        aria-label="Bortamål"
      />
      <span
        className={clsx(
          'ml-1 inline-flex items-center justify-center rounded-xl px-2 text-sm font-bold shadow-card',
          compact ? 'h-10 min-w-[2rem]' : 'h-12 min-w-[2.25rem]',
          sign ? SIGN_STYLES[sign] : 'bg-neutral-100 text-neutral-400'
        )}
        aria-label="Tecken"
        title="Tecken beräknas automatiskt"
      >
        {sign ?? '–'}
      </span>
    </div>
  );
}
