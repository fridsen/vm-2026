import clsx from 'clsx';
import Logo from './Logo.jsx';

// Full-viewport lime backdrop with a centered phone-width column. Onboarding
// renders before the router/Layout, so there's no phone frame around it — the
// column keeps the content phone-sized on desktop.
export default function OnboardingShell({ children, className }) {
  return (
    <div className="min-h-[100dvh] w-full bg-lime">
      <div
        className={clsx(
          'mx-auto flex min-h-[100dvh] w-full max-w-[400px] flex-col px-4 pb-6 pt-12',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Card layout shared by Signup / Login / Payment: the logo sits on the lime
// strip at the top, with a tall black rounded card holding the content.
export function OnboardingCard({ children }) {
  return (
    <OnboardingShell>
      <div className="flex justify-center pb-5">
        <Logo className="h-[84px]" />
      </div>
      <div className="flex flex-1 flex-col gap-8 rounded-[32px] bg-black p-8">
        {children}
      </div>
    </OnboardingShell>
  );
}
