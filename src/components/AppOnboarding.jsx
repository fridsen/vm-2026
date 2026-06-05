import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../hooks/useAuth.js';
import { ENTRY_FEE_SEK, SWISH_NUMBER } from '../services/paymentsService.js';
import onboarding1 from '../assets/onboarding/Onboarding-1.png';
import onboarding2 from '../assets/onboarding/Onboarding-2.png';
import onboarding3 from '../assets/onboarding/Onboarding-3.png';
import onboarding4 from '../assets/onboarding/Onboarding-4.png';
import onboarding5 from '../assets/onboarding/Onboarding-5.png';
import onboarding6 from '../assets/onboarding/Onboarding-6.png';

export const APP_ONBOARDING_SEEN_KEY = 'vm2026:appOnboardingSeen:v1';
export const APP_ONBOARDING_DELAY_MS = 700;
export const APP_ONBOARDING_EXIT_MS = 520;
/** Pause on Mina tips before PredictionSheet opens (after onboarding exit). */
export const APP_ONBOARDING_SHEET_DELAY_MS = 650;

const FEE = ENTRY_FEE_SEK;
const SWISH_FALLBACK = '070-831 20 41';

export function shouldShowAppOnboarding() {
  try {
    return window.localStorage?.getItem(APP_ONBOARDING_SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

export function hasCompletedAppOnboarding() {
  return !shouldShowAppOnboarding();
}

function formatSwishDisplay(raw) {
  const digits = (raw || SWISH_FALLBACK).replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('07')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
  }
  return raw || SWISH_FALLBACK;
}

function buildSteps(firstName) {
  const swish = formatSwishDisplay(SWISH_NUMBER);
  const message = `VM-tips ${firstName}`.trim();

  return [
    {
      id: 'tips-nav',
      image: onboarding1,
      imageAlt: 'Mina tips i menyn',
      title: 'Här lever tipset',
      body: (
        <p>
          Allt du ska fylla i: matcher, grupper och topp 3 finns under{' '}
          <strong>Mina tips</strong>. Det är din arbetsyta fram till deadline.
        </p>
      ),
      cta: 'Fortsätt',
    },
    {
      id: 'segments',
      image: onboarding2,
      imageAlt: 'Matcher, grupper och topp 3',
      title: 'Tre delar av tipset',
      body: (
        <>
          <p>
            <strong>Matcher:</strong> Resultat och tecken i alla matcher.
          </p>
          <p>
            <strong>Grupper:</strong> Rangordna lagen 1–4 i alla 12 grupper.
          </p>
          <p>
            <strong>Vinnare:</strong> Välj ett lag som tar hem VM.
          </p>
        </>
      ),
      cta: 'Fortsätt',
    },
    {
      id: 'progress',
      image: onboarding3,
      imageAlt: 'Framsteg per flik',
      title: 'Så här följer du läget',
      body:
        'Rutan visar vad som gäller i den flik du är på, och cirkeln hur långt du kommit. Målet: 72 matcher, 12 grupper klara, och topp 3 i VM.',
      cta: 'Fortsätt',
    },
    {
      id: 'deadline',
      image: onboarding4,
      imageAlt: 'Deadline vid första avspark',
      title: 'När låser allt?',
      body:
        'Alla tips låses vid första avspark i gruppspelet, 11 juni kl. 21:00. Till dess kan du ändra hur många gånger du vill, efter deadline går inga ändringar.',
      cta: 'Fortsätt',
    },
    {
      id: 'payment',
      image: onboarding5,
      imageAlt: 'Swish-betalning',
      title: 'Betala insatsen',
      body: (
        <>
          <p>
            Insatsen är <strong>{FEE} kr via Swish</strong> och går till potten. Topp tre på
            resultatlistan delar vinsten.
          </p>
          <p>
            <strong>Nummer:</strong> {swish}
          </p>
          <p>
            <strong>Meddelande:</strong> {message}
          </p>
        </>
      ),
      cta: 'Fortsätt',
    },
    {
      id: 'start',
      image: onboarding6,
      imageAlt: 'Tippa din första match',
      title: 'Dags att börja tippa',
      body: (
        <p>
          Öppna <strong>din första match</strong> härifrån. Vi visar hur du sätter mål, tecken och
          sparar i nästa steg.
        </p>
      ),
      cta: 'Till tippningen',
      navigateTo: '/mina-tips',
    },
  ];
}

function StepDots({ count, activeIndex }) {
  return (
    <div className="app-onboarding-dots" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={clsx('app-onboarding-dot', i === activeIndex && 'is-active')} />
      ))}
    </div>
  );
}

function markComplete() {
  try {
    window.localStorage?.setItem(APP_ONBOARDING_SEEN_KEY, '1');
  } catch {
    /* ignore unavailable storage */
  }
}

export default function AppOnboarding({ open, onComplete }) {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const firstName =
    profile?.first_name || (profile?.display_name || user?.email || '').split(/\s+/)[0] || '';
  const steps = buildSteps(firstName);
  const [stepIndex, setStepIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const step = steps[stepIndex];

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setExiting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function finishAndNavigate(target) {
    setExiting(true);
    window.setTimeout(() => {
      markComplete();
      onComplete?.();
      navigate(target, {
        state: {
          openFirstMatch: true,
          openFirstMatchDelay: APP_ONBOARDING_SHEET_DELAY_MS,
          fromAppOnboarding: true,
        },
      });
    }, APP_ONBOARDING_EXIT_MS);
  }

  function handleAdvance() {
    if (!step || exiting) return;

    if (stepIndex >= steps.length - 1) {
      if (step.navigateTo) {
        finishAndNavigate(step.navigateTo);
      } else {
        markComplete();
        onComplete?.();
      }
      return;
    }

    setStepIndex((i) => i + 1);
  }

  if (!open || !step) return null;

  return createPortal(
    <div
      className={clsx('app-onboarding-overlay', exiting && 'is-exiting')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-onboarding-title"
    >
      <div className="app-onboarding-scrim" aria-hidden />
      <div className="app-onboarding-panel">
        <article className="app-onboarding-card">
          <div className="app-onboarding-media">
            <img src={step.image} alt={step.imageAlt} />
          </div>
          <div className="app-onboarding-stack">
            <div className="app-onboarding-copy">
              <h2 id="app-onboarding-title">{step.title}</h2>
              <div className="app-onboarding-body">
                {typeof step.body === 'string' ? <p>{step.body}</p> : step.body}
              </div>
            </div>
            <div className="app-onboarding-actions">
              <button type="button" className="app-onboarding-cta" onClick={handleAdvance}>
                {step.cta}
              </button>
              <StepDots count={steps.length} activeIndex={stepIndex} />
            </div>
          </div>
        </article>
      </div>
      <p className="sr-only">
        Steg {stepIndex + 1} av {steps.length}
      </p>
    </div>,
    document.body,
  );
}
