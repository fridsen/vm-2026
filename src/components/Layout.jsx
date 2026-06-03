import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AddToHomeScreenPrompt from './AddToHomeScreenPrompt.jsx';
import { DesktopNav, MobileBottomNav } from './NavBar.jsx';
import { usePhoneFrame } from '../hooks/usePhoneFrame.js';

const MOBILE_MQ = '(max-width: 767px)';

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

  useEffect(() => {
    if (phoneFrame || window.matchMedia(MOBILE_MQ).matches) {
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
              <Outlet />
            </main>
            <div className="app-mobile-chrome">
              <AddToHomeScreenPrompt />
              <MobileBottomNav alwaysVisible />
            </div>
          </div>
        </div>
        <PhoneFrameToggle on onToggle={toggle} />
      </div>
    );
  }

  return (
    <div className="app-viewport">
      <div className="app-layout flex min-h-0 w-full flex-1 flex-col md:min-h-screen md:flex-row md:items-start">
        <DesktopNav />
        <div className="app-shell flex min-h-0 w-full min-w-0 flex-1 flex-col md:min-h-screen">
          <main
            ref={mainRef}
            className="app-main min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] md:flex-1 md:overflow-visible md:px-8 md:pb-10 md:pt-8"
          >
            <Outlet />
          </main>
        </div>
        <PhoneFrameToggle on={false} onToggle={toggle} />
      </div>
      <div className="app-mobile-chrome">
        <AddToHomeScreenPrompt />
        <MobileBottomNav />
      </div>
    </div>
  );
}
