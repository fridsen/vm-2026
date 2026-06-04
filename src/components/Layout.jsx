import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AnimatedTabOutlet from './AnimatedTabOutlet.jsx';
import AddToHomeScreenPrompt from './AddToHomeScreenPrompt.jsx';
import AppOnboarding, {
  APP_ONBOARDING_DELAY_MS,
  shouldShowAppOnboarding,
} from './AppOnboarding.jsx';
import { DesktopNav, MobileBottomNav } from './NavBar.jsx';
import { usePhoneFrame } from '../hooks/usePhoneFrame.js';
import { useVisualViewportFooter } from '../hooks/useVisualViewportFooter.js';
import PaymentReminderToast from './PaymentReminderToast.jsx';

function PhoneFrameToggle({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed bottom-4 right-4 z-[60] hidden items-center gap-2 rounded-full border border-black/[0.06] bg-surface px-3 py-2 text-xs font-bold text-neutral-700 shadow-card md:flex"
      title="Växla telefonramvy"
    >
      <span aria-hidden>📱</span>
      <span>{on ? 'Full vy' : 'Telefon'}</span>
    </button>
  );
}

export default function Layout() {
  const { phoneFrame, toggle } = usePhoneFrame();
  const location = useLocation();
  const mainRef = useRef(null);
  const [appOnboardingOpen, setAppOnboardingOpen] = useState(false);
  const isHome = location.pathname === '/';

  useVisualViewportFooter(!phoneFrame);

  useEffect(() => {
    if (!shouldShowAppOnboarding()) {
      setAppOnboardingOpen(false);
      return undefined;
    }
    if (appOnboardingOpen) return undefined;
    const delay = isHome ? APP_ONBOARDING_DELAY_MS : 0;
    const timer = window.setTimeout(() => setAppOnboardingOpen(true), delay);
    return () => window.clearTimeout(timer);
  }, [isHome, appOnboardingOpen]);

  useEffect(() => {
    if (phoneFrame) {
      mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.pathname, location.search, phoneFrame]);

  if (phoneFrame) {
    return (
      <div className="phone-frame-host">
        <div className="phone-bezel">
          <div className="phone-screen">
            <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pb-6 pt-12">
              <AnimatedTabOutlet />
            </main>
            <div className="app-mobile-chrome">
              <AddToHomeScreenPrompt />
              <MobileBottomNav alwaysVisible />
            </div>
          </div>
        </div>
        <PhoneFrameToggle on onToggle={toggle} />
        <PaymentReminderToast />
        <AppOnboarding
          open={appOnboardingOpen}
          onComplete={() => setAppOnboardingOpen(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="app-layout flex w-full items-start md:min-h-screen">
        <DesktopNav />
        <div className="app-shell flex min-h-dvh w-full min-w-0 flex-1 flex-col md:min-h-screen">
          <main
            ref={mainRef}
            className="app-main w-full min-w-0 overflow-x-hidden px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] md:flex-1 md:px-8 md:pb-10 md:pt-8"
          >
            <AnimatedTabOutlet />
          </main>
        </div>
        <PhoneFrameToggle on={false} onToggle={toggle} />
      </div>
      <div className="app-mobile-chrome">
        <AddToHomeScreenPrompt />
        <MobileBottomNav />
      </div>
      <PaymentReminderToast />
      <AppOnboarding
        open={appOnboardingOpen}
        onComplete={() => setAppOnboardingOpen(false)}
      />
    </>
  );
}
