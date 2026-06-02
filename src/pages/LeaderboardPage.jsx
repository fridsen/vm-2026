import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import { useAuth } from '../hooks/useAuth.js';
import { usePayments } from '../hooks/usePayments.js';
import PageHeader from '../components/PageHeader.jsx';
import PillToggle from '../components/PillToggle.jsx';

// Deterministic avatar color per userId.
const AVATAR_COLORS = [
  '#A8D227',
  '#C9F73B',
  '#7C3AED',
  '#EC4899',
  '#0EA5E9',
  '#F59E0B',
  '#10B981',
  '#F472B6',
];
function avatarColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initial(name) {
  return name?.[0]?.toUpperCase() ?? '?';
}

const MODES = [
  { value: 'all', label: 'Hela turneringen' },
  { value: 'week', label: 'Denna vecka' },
];

function PaidBadge({ paid }) {
  return (
    <span className={clsx('lb-paid', paid ? 'is-paid' : 'is-unpaid')}>
      {paid ? 'Betald' : 'Ej betald'}
    </span>
  );
}

export default function LeaderboardPage() {
  const { entries, loading } = useLeaderboard();
  const { user } = useAuth();
  const { isAdmin, togglePaid, payments } = usePayments();
  const myUserId = user?.id;
  const [mode, setMode] = useState('all');

  // Prefer the live payments map (updates on toggle) over the leaderboard
  // view's `paid` snapshot, which is only refreshed on a full reload.
  const paidFor = (entry) => payments[entry.userId]?.paid ?? entry.paid;

  const sorted = useMemo(() => {
    if (mode === 'all') return [...entries].sort((a, b) => b.points - a.points);
    // No weekly data available — fall back to matchPoints as a proxy for "recent activity".
    return [...entries].sort((a, b) => (b.matchPoints || 0) - (a.matchPoints || 0));
  }, [entries, mode]);

  const me = sorted.find((e) => e.userId === myUserId);
  const myPos = me ? sorted.indexOf(me) + 1 : null;
  const myPoints = me ? (mode === 'all' ? me.points : me.matchPoints) : 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <PageHeader title="Topplista" subtitle="Laddar…" />
        <div className="card p-8 text-center text-neutral-500">Laddar topplistan…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <PageHeader title="Topplista" subtitle="Du och dina vänner" />

      <div>
        <PillToggle value={mode} onChange={setMode} options={MODES} />
      </div>

      {me && (
        <div className="lb-pinned stagger-child">
          <div className="flex-1">
            <div className="lb-pinned-label">Din placering</div>
            <div className="flex items-center gap-2.5">
              <div className="lb-avatar" style={{ background: avatarColor(me.userId) }}>
                {initial(me.name)}
              </div>
              <div>
                <div className="lb-pinned-name">
                  {me.name} <PaidBadge paid={paidFor(me)} />
                </div>
                <div className="lb-pinned-sub">
                  #{myPos} · {sorted.length} deltagare
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="lb-pinned-pts">{myPoints}</div>
            <div className="lb-pinned-ptslabel">poäng</div>
            {isAdmin ? (
              <button
                type="button"
                className={clsx('lb-paid-toggle', paidFor(me) && 'is-paid')}
                onClick={() => togglePaid(me.userId, !paidFor(me))}
              >
                {paidFor(me) ? 'Markera obetald' : 'Markera betald'}
              </button>
            ) : null}
          </div>
        </div>
      )}

      <div className="section-label">Alla deltagare</div>
      <div>
        {sorted.map((entry, idx) => {
          if (entry.userId === myUserId) return null;
          const points = mode === 'all' ? entry.points : entry.matchPoints || 0;
          const pos = idx + 1;
          const isTop = pos <= 3;
          return (
            <div key={entry.userId} className="lb-row stagger-child">
              <div className={clsx('lb-pos', isTop && 'top')}>{pos}</div>
              <div
                className="lb-sm-avatar"
                style={{ background: avatarColor(entry.userId) }}
              >
                {initial(entry.name)}
              </div>
              <div className="lb-row-info">
                <div className="lb-row-name">
                  {entry.name} <PaidBadge paid={paidFor(entry)} />
                </div>
                <div className="lb-row-sub">
                  Match {entry.matchPoints}p · Grupp {entry.groupPoints}p · Slutspel{' '}
                  {entry.knockoutPoints}p
                </div>
              </div>
              {isAdmin ? (
                <button
                  type="button"
                  className={clsx('lb-paid-toggle', paidFor(entry) && 'is-paid')}
                  onClick={() => togglePaid(entry.userId, !paidFor(entry))}
                >
                  {paidFor(entry) ? 'Markera obetald' : 'Markera betald'}
                </button>
              ) : null}
              <div className="lb-row-pts">{points}</div>
              <div className="lb-move same">—</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
