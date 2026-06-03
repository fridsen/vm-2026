import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

export const MINA_TIPS_ONBOARDING_SEEN_KEY = 'vm2026:minaTipsOnboardingSeen:v1';

const SCRIM = 'rgba(0, 0, 0, 0.8)';

export function shouldShowMinaTipsOnboarding() {
  try {
    return window.localStorage?.getItem(MINA_TIPS_ONBOARDING_SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

const STEPS = [
  {
    id: 'nav',
    target: '[data-onboarding-target="mina-tips-nav"]',
    highlight: 'nav',
    placement: 'above',
    title: 'Det är här du tippar',
    body:
      'Du hittar alla delar av tipset under Mina tips. Du kan alltid gå tillbaka och ändra dina tips fram till deadline som är vid avspark av första gruppspelsmatchen den 11 juni, 21:00.',
    bodySize: '15',
    cta: 'Fortsätt',
  },
  {
    id: 'matcher',
    target: '[data-onboarding-target="mina-tab-matcher"]',
    highlight: 'tab',
    placement: 'below',
    tab: 'matcher',
    title: 'Tippa gruppspelet',
    body:
      'Tippa resultat och tecken för alla 72 matcher i gruppspelet. Du kan ändra ditt tips hur många gånger du vill innan första avsparken i gruppspelet.',
    cta: 'Fortsätt',
  },
  {
    id: 'grupper',
    target: '[data-onboarding-target="mina-tab-grupper"]',
    highlight: 'tab',
    placement: 'below',
    tab: 'grupper',
    title: 'Hur slutar gruppspelet',
    body:
      'Tippa hur grupperna slutar i rangordning. Klicka på lagen i den ordning du tänker att de ska sluta. Om du ändrar dig är det bara att klicka igen på lagen och välja dem i ny ordning.',
    cta: 'Fortsätt',
  },
  {
    id: 'vinnare',
    target: '[data-onboarding-target="mina-tab-vinnare"]',
    highlight: 'tab',
    placement: 'below',
    tab: 'vinnare',
    title: 'Vem vinner VM?',
    body: 'Brasilien, England eller kanske Sverige. 20 poäng om du prickar rätt vinnare!',
    cta: 'Börja tippa!',
    ctaWide: true,
  },
];

function getVisibleTarget(selector) {
  const nodes = document.querySelectorAll(selector);
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
}

function measureTarget(step) {
  const el = getVisibleTarget(step.target);
  if (!el) return null;

  const rect = el.getBoundingClientRect();

  if (step.highlight === 'nav') {
    const size = 73;
    return {
      top: rect.top + rect.height / 2 - size / 2,
      left: rect.left + rect.width / 2 - size / 2,
      width: size,
      height: size,
      radius: size / 2,
    };
  }

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    radius: 12,
  };
}

function useTargetRect(stepIndex, open) {
  const [rect, setRect] = useState(null);
  const step = STEPS[stepIndex];

  const update = useCallback(() => {
    if (!open || !step) {
      setRect(null);
      return;
    }
    setRect(measureTarget(step));
  }, [open, step]);

  useEffect(() => {
    update();
    if (!open) return undefined;

    const onChange = () => update();
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    window.visualViewport?.addEventListener('resize', onChange);
    window.visualViewport?.addEventListener('scroll', onChange);

    const id = window.requestAnimationFrame(onChange);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
      window.visualViewport?.removeEventListener('resize', onChange);
      window.visualViewport?.removeEventListener('scroll', onChange);
    };
  }, [open, update]);

  return { rect, step };
}

function useTargetHighlight(step, open) {
  useEffect(() => {
    if (!open || !step) return undefined;

    const el = getVisibleTarget(step.target);
    if (!el) return undefined;

    const className =
      step.highlight === 'nav'
        ? 'mina-onboarding-highlight-nav'
        : 'mina-onboarding-highlight-tab';
    el.classList.add(className);

    return () => {
      el.classList.remove(className);
    };
  }, [open, step]);
}

function OnboardingCallout({ step, rect, onAdvance }) {
  const cardSide = 24;
  const gap = 12;
  const cardWidth = Math.min(342, window.innerWidth - cardSide * 2);
  const cardStyle = { left: cardSide, width: cardWidth };

  if (rect) {
    if (step.placement === 'below') {
      cardStyle.top = rect.top + rect.height + gap;
    } else {
      cardStyle.bottom = window.innerHeight - rect.top + gap;
    }
  } else {
    cardStyle.top = '50%';
    cardStyle.transform = 'translateY(-50%)';
  }

  return (
    <div className="mina-onboarding-callout" style={cardStyle}>
      <div className="mina-onboarding-card">
        <div className="mina-onboarding-card-copy">
          <h3>{step.title}</h3>
          <p className={step.bodySize === '15' ? 'is-step-one' : undefined}>{step.body}</p>
        </div>
        <button
          type="button"
          className={clsx('mina-onboarding-cta', step.ctaWide && 'is-wide')}
          onClick={onAdvance}
        >
          {step.cta}
        </button>
      </div>
    </div>
  );
}

export default function MinaTipsOnboarding({ open, onStepTab, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const { rect, step } = useTargetRect(stepIndex, open);

  useTargetHighlight(step, open);

  useEffect(() => {
    if (!open) return undefined;
    const targets = [document.body, document.querySelector('.app-main')].filter(Boolean);
    const previous = targets.map((t) => t.style.overflow);
    targets.forEach((t) => {
      t.style.overflow = 'hidden';
    });
    return () => {
      targets.forEach((t, i) => {
        t.style.overflow = previous[i];
      });
    };
  }, [open]);

  useEffect(() => {
    if (!open) setStepIndex(0);
  }, [open]);

  function handleAdvance() {
    if (stepIndex >= STEPS.length - 1) {
      onComplete?.();
      return;
    }
    const next = stepIndex + 1;
    setStepIndex(next);
    const nextTab = STEPS[next]?.tab;
    if (nextTab) onStepTab?.(nextTab);
  }

  if (!open || !step) return null;

  return createPortal(
    <div
      className="mina-onboarding-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mina-onboarding-title"
    >
      {rect && (
        <div
          className={clsx(
            'mina-onboarding-hole',
            step.highlight === 'nav' && 'is-nav',
            step.highlight === 'tab' && 'is-tab',
          )}
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: rect.radius,
            boxShadow: `0 0 0 9999vmax ${SCRIM}`,
          }}
          aria-hidden
        />
      )}
      {!rect && <div className="mina-onboarding-scrim-fill" style={{ background: SCRIM }} aria-hidden />}
      <div className="mina-onboarding-blocker" aria-hidden />
      <OnboardingCallout step={step} rect={rect} onAdvance={handleAdvance} />
      <p id="mina-onboarding-title" className="sr-only">
        {step.title}
      </p>
      <p className="sr-only">
        Steg {stepIndex + 1} av {STEPS.length}
      </p>
    </div>,
    document.body,
  );
}
