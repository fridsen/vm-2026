import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import OnboardingScene from './onboarding/OnboardingScene.jsx';

// Orchestrates the onboarding flow before the app renders. A single phase is
// derived from auth state (plus the local landing/signup/login choice) and
// handed to OnboardingScene, which keeps the lime backdrop, logo and card
// mounted throughout so they can animate between phases:
//   loading            → splash (hero logo)
//   not signed in      → landing ⇄ signup ⇄ login
//   no profile yet     → complete (rare: Google with no name claim)
//   otherwise          → the app (payment is in-app onboarding, not here)
export default function AuthGate({ children }) {
  const { user, profile, loading } = useAuth();
  // Which unauthenticated screen to show (no router available out here).
  const [screen, setScreen] = useState('landing');

  let phase;
  if (loading) phase = 'splash';
  else if (!user) phase = screen; // landing | signup | login
  else if (!profile) phase = 'complete';
  else phase = 'app';

  if (phase === 'app') return children;

  return <OnboardingScene phase={phase} onSetScreen={setScreen} />;
}
