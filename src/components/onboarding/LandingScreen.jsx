import OnboardingShell from './OnboardingShell.jsx';
import Logo from './Logo.jsx';
import OnboardingButton from './OnboardingButton.jsx';

// Entry screen: brand + the two paths into the app.
export default function LandingScreen({ onSignup, onLogin }) {
  return (
    <OnboardingShell>
      <div className="flex flex-1 flex-col items-center justify-center">
        <Logo className="h-[260px]" />
        <div className="mt-3 text-center font-display leading-[0.9] tracking-[-0.02em]">
          <div className="text-[60px] text-black">VM-TIPSET</div>
          <div className="text-[60px] text-black/40">2026</div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <OnboardingButton variant="dark" onClick={onSignup}>
          Gå med i VM-Tipset
        </OnboardingButton>
        <OnboardingButton variant="outline-dark" onClick={onLogin}>
          Logga in
        </OnboardingButton>
      </div>
    </OnboardingShell>
  );
}
