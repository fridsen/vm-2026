import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAllMatches, useKnockoutMatches } from '../hooks/useMatches.js';
import { useLockState } from '../hooks/useLockState.js';
import { buildScheduleDays, formatMatchCount } from '../utils/matchSchedule.js';

function LiveBadge({ inverted = false }) {
  return (
    <span
      className={clsx(
        'chip shrink-0 ring-1',
        inverted
          ? 'bg-red-400/20 text-red-200 ring-red-400/40'
          : 'bg-red-500/15 text-red-600 ring-red-500/30'
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
      </span>
      Live
    </span>
  );
}

function DayPill({ day }) {
  const isToday = day.isToday;

  return (
    <Link
      to="/matcher"
      data-today={isToday ? '' : undefined}
      className={clsx(
        'flex shrink-0 flex-col gap-1 rounded-2xl border px-4 py-3 transition-colors',
        isToday
          ? 'border-accent bg-accent text-accent-foreground shadow-card'
          : 'border-neutral-200/70 bg-surface text-neutral-900 hover:border-neutral-300'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold capitalize">{day.dateLabel}</span>
        {day.isLive && <LiveBadge inverted={isToday} />}
      </div>
      <span
        className={clsx(
          'text-xs font-medium tabular-nums',
          isToday ? 'text-accent-foreground/70' : 'text-neutral-500'
        )}
      >
        {formatMatchCount(day.count)}
      </span>
    </Link>
  );
}

export default function GameScheduleTicker() {
  const scrollRef = useRef(null);
  const { matches: groupMatches, loading: groupLoading } = useAllMatches();
  const { matches: knockoutMatches, loading: koLoading } = useKnockoutMatches();
  const { now, loading: lockLoading } = useLockState();

  const loading = groupLoading || koLoading || lockLoading;

  const days = useMemo(() => {
    if (loading) return [];
    const all = [...groupMatches, ...knockoutMatches];
    return buildScheduleDays(all, now);
  }, [groupMatches, knockoutMatches, now, loading]);

  useEffect(() => {
    if (!days.length) return;
    const container = scrollRef.current;
    if (!container) return;
    const todayEl = container.querySelector('[data-today]');
    const target = todayEl ?? container.firstElementChild;
    if (!target) return;
    const offset = target.offsetLeft - container.offsetLeft;
    container.scrollTo({ left: Math.max(0, offset - 8), behavior: 'smooth' });
  }, [days]);

  if (loading) {
    return (
      <section aria-label="Kommande speldagar" className="-mx-4 md:-mx-8">
        <div className="flex gap-2 overflow-hidden px-4 md:px-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[68px] w-28 shrink-0 animate-pulse rounded-2xl bg-neutral-200"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!days.length) return null;

  return (
    <section aria-label="Kommande speldagar" className="-mx-4 md:-mx-8">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 pb-1 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((day) => (
          <DayPill key={day.dayKey} day={day} />
        ))}
      </div>
    </section>
  );
}
