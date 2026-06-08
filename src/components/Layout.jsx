import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
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
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const [appOnboardingOpen, setAppOnboardingOpen] = useState(false);
  const isHome = location.pathname === '/';
  const userId = user?.id;

  useVisualViewportFooter(!phoneFrame);

  // BrowserRouter is unmounted during auth onboarding, so the address bar can
  // still point at /profile (or elsewhere). New users should start on Hem.
  useEffect(() => {
    if (!userId || !shouldShowAppOnboarding(userId, profile)) return;
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [userId, profile, location.pathname, navigate]);

  useEffect(() => {
    if (!userId || !shouldShowAppOnboarding(userId, profile)) {
      setAppOnboardingOpen(false);
      return undefined;
    }
    if (!isHome) {
      setAppOnboardingOpen(false);
      return undefined;
    }
    if (appOnboardingOpen) return undefined;
    const timer = window.setTimeout(() => setAppOnboardingOpen(true), APP_ONBOARDING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isHome, appOnboardingOpen, userId, profile]);

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
            <main ref={mainRef} className="app-main flex-1 overflow-x-clip overflow-y-auto px-4 pt-6">
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
            className="app-main w-full min-w-0 overflow-x-clip px-4 pt-[env(safe-area-inset-top)] md:flex-1 md:px-8 md:pt-0"
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
