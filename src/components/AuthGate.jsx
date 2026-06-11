import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { isProfileComplete } from '../services/authService.js';
import AppBootSplash from './AppBootSplash.jsx';
import OnboardingScene from './onboarding/OnboardingScene.jsx';

// Orchestrates the onboarding flow before the app renders. A single phase is
// derived from auth state (plus the local landing/signup/login choice) and
// handed to OnboardingScene, which keeps the lime backdrop, logo and card
// mounted throughout so they can animate between phases:
//   loading            → neutral boot splash (page bg, not lime onboarding)
//   not signed in      → landing ⇄ signup ⇄ login
//   incomplete profile → complete (missing first or last name)
//   otherwise          → the app (payment is in-app onboarding, not here)
export default function AuthGate({ children }) {
  const { user, profile, loading } = useAuth();
  // Which unauthenticated screen to show (no router available out here).
  const [screen, setScreen] = useState('landing');

  useEffect(() => {
    if (!user) setScreen('landing');
  }, [user]);

  if (loading) return <AppBootSplash />;

  if (!user) {
    return <OnboardingScene phase={screen} onSetScreen={setScreen} />;
  }

  if (!isProfileComplete(profile)) {
    return <OnboardingScene phase="complete" onSetScreen={setScreen} />;
  }

  return children;
}
