import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AddToHomeScreenPrompt from './AddToHomeScreenPrompt.jsx';
import { DesktopNav, MobileBottomNav } from './NavBar.jsx';
import { usePhoneFrame } from '../hooks/usePhoneFrame.js';

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
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  if (phoneFrame) {
    return (
      <div className="phone-frame-host">
        <div className="phone-bezel">
          <div className="phone-screen">
            <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pb-6 pt-12">
              <Outlet />
            </main>
            <div className="app-mobile-footer shrink-0">
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
    <div className="flex min-h-screen w-full md:min-h-screen">
      <DesktopNav />
      <div className="app-shell fixed inset-0 flex w-full min-w-0 flex-col md:static md:min-h-screen md:flex-1">
        <main
          ref={mainRef}
          className="w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] md:overflow-visible md:px-8 md:pb-10 md:pt-8"
        >
          <Outlet />
        </main>
        <div className="app-mobile-footer shrink-0">
          <AddToHomeScreenPrompt />
          <MobileBottomNav />
        </div>
      </div>
      <PhoneFrameToggle on={false} onToggle={toggle} />
    </div>
  );
}
