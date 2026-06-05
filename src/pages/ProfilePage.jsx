import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import { usePayments } from '../hooks/usePayments.js';
import { haptics } from '../utils/haptics.js';

function initialsForName(name) {
  return (name || 'Spelaren')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatSek(value) {
  return new Intl.NumberFormat('sv-SE', {
    maximumFractionDigits: 0,
  }).format(value);
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.5 14.5 14.5 9.5M10.5 6.5l1.12-1.12a4 4 0 1 1 5.66 5.66L15.5 12.82M13.5 17.5l-1.12 1.12a4 4 0 0 1-5.66-5.66L8.5 11.18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const { entries } = useLeaderboard();
  const { myPayment, payments, entryFee, isAdmin } = usePayments();
  const [copied, setCopied] = useState(false);
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Spelaren';
  const initials = initialsForName(displayName);
  const participantCount = entries.length || Object.keys(payments || {}).length || 0;
  const totalPot = participantCount > 0 ? entryFee * participantCount : 0;
  const payout = useMemo(
    () => ({
      first: Math.round(totalPot * 0.6),
      second: Math.round(totalPot * 0.3),
      third: Math.round(totalPot * 0.1),
    }),
    [totalPot],
  );
  const paid = Boolean(myPayment?.paid || profile?.payment_ack);

  const inviteUrl =
    typeof window === 'undefined' ? '' : `${window.location.origin}/`;

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      haptics.success();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      haptics.error();
    }
  }

  return (
    <div className="profile-page tab-page-enter">
      <header className="profile-hero">
        <div className="profile-avatar">{initials || 'S'}</div>
        <h1>{displayName}</h1>
      </header>

      <section className="profile-section">
        <h2>Tävlingen</h2>
        <div className="profile-card">
          <div className="profile-row">
            <span>Betalning</span>
            <strong className={paid ? 'profile-paid' : 'profile-unpaid'}>
              {paid ? '✓ Betald' : 'Ej betald'}
            </strong>
          </div>
          <div className="profile-row">
            <span>Antal deltagare</span>
            <strong>
              {participantCount} {participantCount === 1 ? 'spelare' : 'spelare'}
            </strong>
          </div>
          <div className="profile-row">
            <span>Total pott</span>
            <strong>{formatSek(totalPot)} kr</strong>
          </div>
          <div className="profile-row profile-payout-row">
            <span>Utdelning</span>
            <strong>
              1a: {formatSek(payout.first)}kr · 2a: {formatSek(payout.second)}kr · 3a:{' '}
              {formatSek(payout.third)}kr
            </strong>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="profile-section">
          <h2>Admin</h2>
          <div className="profile-card flex flex-col gap-2 p-4 text-sm font-bold">
            <Link to="/admin/betalningar" className="text-green-700">
              Betalningar och påminnelser
            </Link>
            <Link to="/admin/tipphistorik" className="text-green-700">
              Tipphistorik
            </Link>
          </div>
        </section>
      )}

      <section className="profile-section">
        <h2>Bjud in</h2>
        <button type="button" className="profile-invite-button" onClick={copyInviteLink}>
          <LinkIcon />
          <span>{copied ? 'Länk kopierad!' : 'Kopiera inbjudningslänk'}</span>
        </button>
      </section>

      <section className="profile-section">
        <h2>Konto</h2>
        <button
          type="button"
          className="profile-logout-button"
          onClick={() => {
            haptics.light();
            signOut();
          }}
        >
          Logga ut
        </button>
      </section>
    </div>
  );
}
