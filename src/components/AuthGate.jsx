import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import SplashScreen from './onboarding/SplashScreen.jsx';
import LandingScreen from './onboarding/LandingScreen.jsx';
import SignupScreen from './onboarding/SignupScreen.jsx';
import LoginScreen from './onboarding/LoginScreen.jsx';
import CompleteProfileScreen from './onboarding/CompleteProfileScreen.jsx';
import PaymentScreen from './onboarding/PaymentScreen.jsx';

// Orchestrates the onboarding flow before the app renders:
//   loading            → Splash
//   not signed in      → Landing ⇄ Signup ⇄ Login
//   no profile yet     → CompleteProfile (rare: Google with no name claim)
//   payment not acked  → Payment (shown once after signup)
//   otherwise          → the app
export default function AuthGate({ children }) {
  const { user, profile, loading } = useAuth();
  // Which unauthenticated screen to show (no router available out here).
  const [screen, setScreen] = useState('landing');

  if (loading) return <SplashScreen />;

  if (!user) {
    if (screen === 'signup') {
      return <SignupScreen onGoToLogin={() => setScreen('login')} />;
    }
    if (screen === 'login') {
      return <LoginScreen onGoToSignup={() => setScreen('signup')} />;
    }
    return (
      <LandingScreen
        onSignup={() => setScreen('signup')}
        onLogin={() => setScreen('login')}
      />
    );
  }

  if (!profile) return <CompleteProfileScreen />;

  if (!profile.payment_ack) return <PaymentScreen />;

  return children;
}
