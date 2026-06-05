import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth.js';
import Logo from './Logo.jsx';
import OnboardingButton from './OnboardingButton.jsx';
import SignupScreen from './SignupScreen.jsx';
import LoginScreen from './LoginScreen.jsx';
import CompleteProfileScreen from './CompleteProfileScreen.jsx';

// Phases that render the bottom card with a small logo pinned to the top.
const FORM_PHASES = ['signup', 'login', 'complete'];

// Persistent onboarding scene. The lime backdrop, the logo and the black card
// live here for the whole flow so they can animate between phases instead of
// being unmounted/remounted per screen:
//   - the logo shrinks from its big centred "hero" pose to a small pinned pose
//     when moving from the landing screen into a form;
//   - the black card slides up (grows) from the bottom of the screen.
export default function OnboardingScene({ phase, onSetScreen }) {
  const { signOut } = useAuth();
  const isForm = FORM_PHASES.includes(phase);
  const showBack = isForm;
  const goBack = () => {
    if (phase === 'signup' || phase === 'login') onSetScreen('landing');
    else signOut();
  };

  // Keep the last form phase so the card still has content while it slides back
  // down to the landing screen (the card stays mounted across all phases).
  const [lastForm, setLastForm] = useState('signup');
  useEffect(() => {
    if (!isForm) return undefined;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLastForm(phase);
    });
    return () => {
      cancelled = true;
    };
  }, [phase, isForm]);
  const renderPhase = isForm ? phase : lastForm;

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[100dvh] overflow-hidden overscroll-none bg-lime">
      <div className="relative mx-auto h-full w-full max-w-[400px]">
        {/* Back arrow — pinned near the top on form screens. */}
        <button
          type="button"
          onClick={goBack}
          aria-label="Tillbaka"
          className={clsx(
            'onb-fade absolute left-6 top-[calc(env(safe-area-inset-top)+1rem)] z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black text-lime',
            showBack ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M14 8H2m0 0 5-5M2 8l5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Logo: hero pose on landing, pinned below the back arrow on form screens. */}
        <div
          className="onb-logo absolute left-1/2 z-30 inline-flex -translate-x-1/2"
          style={
            isForm
              ? {
                  top: 'calc(env(safe-area-inset-top) + 4.5rem)',
                  height: '100px',
                  width: '4.0625rem',
                }
              : {
                  top: 'calc(46% - 120px)',
                  height: '240px',
                  width: '9.75rem',
                }
          }
        >
          <Logo className="h-full w-full" />
        </div>

        {/* Landing call-to-action buttons (fade out when entering a form). */}
        <div
          className={clsx(
            'onb-fade absolute inset-x-4 bottom-[max(1.75rem,env(safe-area-inset-bottom))] z-10 flex flex-col gap-3',
            phase === 'landing' ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <OnboardingButton variant="dark" onClick={() => onSetScreen('signup')}>
            Gå med i VM-Tipset
          </OnboardingButton>
          <OnboardingButton variant="outline-dark" onClick={() => onSetScreen('login')}>
            Logga in
          </OnboardingButton>
        </div>

        {/* Black card: flush to screen edges, grows with content from the bottom. */}
        <div
          className="onb-card absolute inset-x-0 bottom-0 z-10 flex flex-col gap-8 rounded-t-[32px] bg-black p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          style={{ transform: isForm ? 'translateY(0)' : 'translateY(100%)' }}
        >
          {renderPhase === 'signup' && <SignupScreen />}
          {renderPhase === 'login' && <LoginScreen />}
          {renderPhase === 'complete' && <CompleteProfileScreen />}
        </div>
      </div>
    </div>
  );
}
