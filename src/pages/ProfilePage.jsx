import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useLeaderboard } from '../hooks/useLeaderboard.js';
import { usePayments } from '../hooks/usePayments.js';
import SwishPaymentPrompt from '../components/SwishPaymentPrompt.jsx';
import {
  adminFeeSek,
  formatPrizePayoutPcts,
  prizePoolSek,
  PRIZE_POOL_ADMIN_FEE_PCT,
} from '../services/paymentsService.js';
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

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M14 8H2m0 0 5-5M2 8l5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden="true">
      <path
        d="M1 1l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileRow({ label, value, badge }) {
  return (
    <div className="profile-row">
      <span>{label}</span>
      {badge ?? <strong>{value}</strong>}
    </div>
  );
}

function ProfileLinkRow({ to, children }) {
  return (
    <Link to={to} className="profile-link-row">
      <span>{children}</span>
      <ChevronRightIcon />
    </Link>
  );
}

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const { entries } = useLeaderboard();
  const { myPayment, payments, entryFee, isAdmin } = usePayments();
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Spelaren';
  const initials = initialsForName(displayName);
  const participantCount = entries.length || Object.keys(payments || {}).length || 0;
  const totalPot = prizePoolSek(entryFee, participantCount);
  const adminFee = adminFeeSek(entryFee, participantCount);
  const paid = Boolean(myPayment?.paid || profile?.payment_ack);
  const showSwishPrompt = !myPayment?.paid;
  const firstName =
    profile?.first_name ||
    displayName.split(/\s+/).filter(Boolean)[0] ||
    'namn';
  const inviteUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/`;

  async function inviteFriends() {
    haptics.light();
    const shareData = {
      title: 'VM-Tipset 2026',
      text: 'Häng med i VM-tipset!',
      url: inviteUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(inviteUrl);
      haptics.success();
    } catch (err) {
      if (err?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(inviteUrl);
        haptics.success();
      } catch {
        haptics.error();
      }
    }
  }

  async function handleSignOut() {
    haptics.light();
    await signOut();
  }

  return (
    <div className="profile-page tab-page-enter">
      <header className="profile-header">
        <Link to="/" className="profile-back" aria-label="Tillbaka">
          <BackIcon />
        </Link>
        <div className="profile-hero">
          <div className="profile-avatar">{initials || 'S'}</div>
          <h1>{displayName}</h1>
        </div>
      </header>

      <div className="profile-card">
        <ProfileRow
          label="Betalning"
          badge={
            <strong className={paid ? 'profile-badge profile-badge--paid' : 'profile-badge profile-badge--unpaid'}>
              {paid ? 'Betald' : 'Ej betalat'}
            </strong>
          }
        />
        <ProfileRow
          label="Antal deltagare"
          value={`${participantCount} tippare`}
        />
        <ProfileRow label="Prispott" value={`${formatSek(totalPot)} kr`} />
        <ProfileRow
          label="Administrationsavgift"
          value={`${PRIZE_POOL_ADMIN_FEE_PCT}% (${formatSek(adminFee)} kr)`}
        />
        <ProfileRow label="Fördelning prispott i %" value={formatPrizePayoutPcts()} />
      </div>

      {showSwishPrompt && <SwishPaymentPrompt firstName={firstName} />}

      {isAdmin && (
        <div className="profile-card">
          <ProfileLinkRow to="/admin/betalningar">Betalning och påminnelser</ProfileLinkRow>
          <ProfileLinkRow to="/admin/sync">Matchsync (hälsa)</ProfileLinkRow>
          <ProfileLinkRow to="/admin/tipphistorik">Tipphistorik</ProfileLinkRow>
        </div>
      )}

      <div className="profile-actions">
        <button type="button" className="profile-invite-button" onClick={inviteFriends}>
          Bjud in vänner
        </button>
        <button type="button" className="profile-logout-button" onClick={handleSignOut}>
          Logga ut
        </button>
      </div>
    </div>
  );
}
