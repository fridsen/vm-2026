import { useEffect, useState } from 'react';
import clsx from 'clsx';
import Logo from './Logo.jsx';
import OnboardingButton from './OnboardingButton.jsx';
import SignupScreen from './SignupScreen.jsx';
import LoginScreen from './LoginScreen.jsx';
import CompleteProfileScreen from './CompleteProfileScreen.jsx';
import PaymentScreen from './PaymentScreen.jsx';

// Phases that render the bottom card with a small logo pinned to the top.
const FORM_PHASES = ['signup', 'login', 'complete', 'payment'];

// Persistent onboarding scene. The lime backdrop, the logo and the black card
// live here for the whole flow so they can animate between phases instead of
// being unmounted/remounted per screen:
//   - the logo shrinks from its big centred "hero" pose to a small pinned pose
//     when moving from the landing screen into a form;
//   - the black card slides up (grows) from the bottom of the screen.
export default function OnboardingScene({ phase, onSetScreen }) {
  const isForm = FORM_PHASES.includes(phase);
  const showBack = phase === 'signup' || phase === 'login';

  // Keep the last form phase so the card still has content while it slides back
  // down to the landing screen (the card stays mounted across all phases).
  const [lastForm, setLastForm] = useState('signup');
  useEffect(() => {
    if (isForm) setLastForm(phase);
  }, [phase, isForm]);
  const renderPhase = isForm ? phase : lastForm;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden overscroll-none bg-lime">
      <div className="relative mx-auto h-full w-full max-w-[400px]">
        {/* Back arrow (signup / login only). */}
        <button
          type="button"
          onClick={() => onSetScreen('landing')}
          aria-label="Tillbaka"
          className={clsx(
            'onb-fade absolute left-5 top-14 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black text-lime',
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

        {/* Persistent logo: animates between the hero pose and the pinned pose. */}
        <div
          className="onb-logo absolute left-1/2 z-10 inline-flex -translate-x-1/2"
          style={
            isForm
              ? { top: '123px', height: '100px' }
              : { top: 'calc(46% - 120px)', height: '240px' }
          }
        >
          <Logo className="h-full" />
        </div>

        {/* Landing call-to-action buttons (fade out when entering a form). */}
        <div
          className={clsx(
            'onb-fade absolute inset-x-4 bottom-7 z-10 flex flex-col gap-3',
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

        {/* Black card: grows up from the bottom of the screen. */}
        <div
          className="onb-card absolute inset-x-2 bottom-2 z-10 flex max-h-[calc(100dvh-240px)] flex-col gap-8 overflow-y-auto rounded-[32px] bg-black p-8"
          style={{ transform: isForm ? 'translateY(0)' : 'translateY(120%)' }}
        >
          {renderPhase === 'signup' && (
            <SignupScreen onGoToLogin={() => onSetScreen('login')} />
          )}
          {renderPhase === 'login' && <LoginScreen />}
          {renderPhase === 'complete' && <CompleteProfileScreen />}
          {renderPhase === 'payment' && <PaymentScreen />}
        </div>
      </div>
    </div>
  );
}
