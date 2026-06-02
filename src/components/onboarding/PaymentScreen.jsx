import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { ENTRY_FEE_SEK, SWISH_NUMBER } from '../../services/paymentsService.js';
import { OnboardingCard } from './OnboardingShell.jsx';
import OnboardingButton from './OnboardingButton.jsx';

// Design fallbacks so the screen reads sensibly when the env vars are unset.
const FEE = ENTRY_FEE_SEK || 200;
const SWISH = SWISH_NUMBER || '070-831 20 41';

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };
  return (
    <div className="flex items-center justify-between rounded-[10px] border border-white/10 bg-white/[0.08] px-4 py-3">
      <div className="flex flex-col gap-1.5">
        <span className="font-barlow text-[10px] font-semibold uppercase leading-none text-white/40">
          {label}
        </span>
        <span className="font-barlow text-lg font-bold leading-none text-white">
          {value}
        </span>
      </div>
      <button
        type="button"
        onClick={copy}
        className="rounded-lg border border-lime/20 bg-lime/10 px-2.5 py-1.5 font-barlow text-xs text-lime"
      >
        {copied ? 'Kopierat' : 'Kopiera'}
      </button>
    </div>
  );
}

export default function PaymentScreen() {
  const { profile, acknowledgePayment } = useAuth();
  const [acking, setAcking] = useState(false);
  const firstName =
    profile?.first_name || (profile?.display_name || '').split(/\s+/)[0] || '';
  const message = `VM-TIPS ${firstName}`.trim();

  const openSwish = () => {
    // Best-effort deep link into the Swish app on mobile.
    window.location.href = 'swish://';
  };

  const confirm = async () => {
    setAcking(true);
    try {
      await acknowledgePayment();
    } finally {
      setAcking(false);
    }
  };

  return (
    <OnboardingCard>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-[32px] leading-[32px] tracking-[-0.32px] text-lime">
          Betala insatsen
        </h1>
        <p className="font-barlow text-base text-white">
          Sista steget innan du är igång!
        </p>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <div className="font-display text-[60px] leading-[60px] tracking-[-0.6px] text-lime">
          {FEE} kr
        </div>
        <p className="font-barlow text-base text-white">Deltagaravgift</p>
      </div>

      <div className="flex flex-col gap-2">
        <CopyRow label="Swisha till" value={SWISH} />
        <CopyRow label="Meddelande" value={message} />
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <OnboardingButton variant="primary" onClick={openSwish}>
          Öppna swish
        </OnboardingButton>
        <OnboardingButton variant="outline-light" onClick={confirm} disabled={acking}>
          {acking ? 'Ett ögonblick…' : 'Jag har betalat'}
        </OnboardingButton>
      </div>
    </OnboardingCard>
  );
}
