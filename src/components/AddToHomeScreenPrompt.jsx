import { useAddToHomeScreen } from '../hooks/useAddToHomeScreen.js';

function PlusAppIcon() {
  return (
    <div className="a2hs-float-app-icon" aria-hidden="true">
      <span className="a2hs-float-plus">+</span>
    </div>
  );
}

function IosShareIcon() {
  return (
    <span className="a2hs-inline-share" aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none">
        <rect width="20" height="20" rx="5" fill="#0A84FF" />
        <path
          d="M10 5v7M7.5 8.5 10 5l2.5 3.5M6 12h8"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function ChromeMenuDots() {
  return <span className="a2hs-inline-dots" aria-hidden="true">⋯</span>;
}

function SafariInstructions() {
  return (
    <p className="a2hs-float-steps">
      Tryck <span className="a2hs-inline-dots">···</span> → <IosShareIcon /> Dela →{' '}
      <span className="a2hs-float-quote">Visa mer</span> →{' '}
      <span className="a2hs-float-quote">Lägg till på hemskärmen</span>
    </p>
  );
}

function ChromeInstructions() {
  return (
    <p className="a2hs-float-steps">
      Tryck <ChromeMenuDots /> menyn →{' '}
      <span className="a2hs-float-quote">Lägg till på startskärmen</span>
    </p>
  );
}

export default function AddToHomeScreenPrompt() {
  const { visible, iosBrowser, later, dismissPrompt } = useAddToHomeScreen();

  if (!visible) return null;

  return (
    <div
      className="a2hs-float-host"
      role="dialog"
      aria-labelledby="a2hs-float-title"
      aria-describedby="a2hs-float-steps"
    >
      <div className="a2hs-float-card">
        <button
          type="button"
          className="a2hs-float-close"
          onClick={later}
          aria-label="Stäng"
        >
          ×
        </button>

        <div className="a2hs-float-main">
          <PlusAppIcon />
          <div className="a2hs-float-copy">
            <h2 id="a2hs-float-title">Lägg till på hemskärmen</h2>
            <div id="a2hs-float-steps">
              {iosBrowser === 'chrome' ? <ChromeInstructions /> : <SafariInstructions />}
            </div>
          </div>
        </div>

        <div className="a2hs-float-actions">
          <button type="button" className="a2hs-float-never" onClick={dismissPrompt}>
            Påminn inte igen
          </button>
          <button type="button" className="a2hs-float-later" onClick={later}>
            Senare
          </button>
        </div>
      </div>
    </div>
  );
}
