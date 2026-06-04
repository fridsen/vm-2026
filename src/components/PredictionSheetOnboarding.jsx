import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';

export const PREDICTION_SHEET_ONBOARDING_SEEN_KEY = 'vm2026:predictionSheetOnboardingSeen:v1';
export const PREDICTION_SHEET_ONBOARDING_DELAY_MS = 550;
export const PREDICTION_SHEET_ONBOARDING_FADE_MS = 400;

const SHEET_ROOT_SELECTOR = '[data-bottom-sheet-overlay]';
const SCRIM = 'rgba(0, 0, 0, 0.6)';

export function shouldShowPredictionSheetOnboarding() {
  try {
    return window.localStorage?.getItem(PREDICTION_SHEET_ONBOARDING_SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

const STEPS = [
  {
    id: 'score',
    target: '[data-onboarding-target="prediction-score-steppers"]',
    placement: 'below',
    title: 'Hur många mål gör lagen?',
    body:
      'Använd plus (+) och minus (-) knapparna för att ändra hur många mål de båda lagen gör.',
    cta: 'Fortsätt',
  },
  {
    id: 'market',
    target: '[data-onboarding-target="prediction-market"]',
    placement: 'above',
    title: 'Hur slutar matchen?',
    body:
      'Välj vilket tecken du vill tippa, du behöver inte välja tecken efter resultat men då förlorar du chansen till bonuspoängen du får om du prickar rätt resultat och tecken.',
    cta: 'Fortsätt',
  },
  {
    id: 'footer',
    target: '[data-onboarding-target="prediction-footer"]',
    placement: 'above',
    title: 'Spara och gå vidare',
    body:
      'Glöm inte att spara ditt tips efter du satt resultat och tecken, när du sparat tipset går du vidare automatiskt till nästa match. Vill du inte tippa nästa match är det bara att klicka på mörka bakgrunden eller dra ner modalen för att komma tillbaka.',
    cta: 'Jag är redo!',
    ctaWide: true,
  },
];

function getSheetRoot() {
  return document.querySelector(SHEET_ROOT_SELECTOR);
}

function getVisibleTarget(selector) {
  const root = getSheetRoot() || document;
  const nodes = root.querySelectorAll(selector);
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
    if (!open || !step) return undefined;
    if (step.id === 'footer') {
      const el = getVisibleTarget(step.target);
      el?.scrollIntoView({ block: 'end', behavior: 'instant' });
    }
    update();
    const remeasure = window.setTimeout(update, 50);
    return () => window.clearTimeout(remeasure);
  }, [open, step?.id, update]);

  useEffect(() => {
    update();
    if (!open) return undefined;

    const onChange = () => update();
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    window.visualViewport?.addEventListener('resize', onChange);
    window.visualViewport?.addEventListener('scroll', onChange);

    const root = getSheetRoot();
    root?.addEventListener('scroll', onChange, true);

    const id = window.requestAnimationFrame(onChange);
    const retry = window.setTimeout(onChange, 360);

    return () => {
      window.cancelAnimationFrame(id);
      window.clearTimeout(retry);
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
      window.visualViewport?.removeEventListener('resize', onChange);
      window.visualViewport?.removeEventListener('scroll', onChange);
      root?.removeEventListener('scroll', onChange, true);
    };
  }, [open, update]);

  return { rect, step };
}

function useTargetHighlight(step, open) {
  useEffect(() => {
    if (!open || !step) return undefined;

    const el = getVisibleTarget(step.target);
    if (!el) return undefined;

    el.classList.add('prediction-onboarding-highlight');
    return () => {
      el.classList.remove('prediction-onboarding-highlight');
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
    <div className="prediction-onboarding-callout" style={cardStyle}>
      <div className="prediction-onboarding-card">
        <div className="prediction-onboarding-card-copy">
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </div>
        <button
          type="button"
          className={clsx('prediction-onboarding-cta', step.ctaWide && 'is-wide')}
          onClick={onAdvance}
        >
          {step.cta}
        </button>
      </div>
    </div>
  );
}

/** Spotlight tour inside the portaled BottomSheet overlay. */
export default function PredictionSheetOnboarding({ open, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const { rect, step } = useTargetRect(stepIndex, open && fadeIn);

  useTargetHighlight(step, open && fadeIn);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setFadeIn(false);
      return undefined;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFadeIn(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      setFadeIn(false);
    };
  }, [open]);

  function handleAdvance() {
    if (stepIndex >= STEPS.length - 1) {
      onComplete?.();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  if (!open || !step) return null;

  return (
    <div
      className={clsx(
        'prediction-sheet-onboarding',
        fadeIn && 'is-visible',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prediction-sheet-onboarding-title"
    >
      {rect && (
        <div
          className="prediction-onboarding-hole"
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
      {!rect && (
        <div className="prediction-onboarding-scrim-fill" style={{ background: SCRIM }} aria-hidden />
      )}
      <div className="prediction-onboarding-blocker" aria-hidden />
      <OnboardingCallout step={step} rect={rect} onAdvance={handleAdvance} />
      <p id="prediction-sheet-onboarding-title" className="sr-only">
        {step.title}
      </p>
      <p className="sr-only">
        Steg {stepIndex + 1} av {STEPS.length}
      </p>
    </div>
  );
}
