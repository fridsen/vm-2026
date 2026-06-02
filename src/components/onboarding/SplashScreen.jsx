import OnboardingShell from './OnboardingShell.jsx';
import Logo from './Logo.jsx';

// Shown while the auth session is resolving on a cold load.
export default function SplashScreen() {
  return (
    <OnboardingShell className="items-center justify-center">
      <Logo className="h-[280px]" />
    </OnboardingShell>
  );
}
