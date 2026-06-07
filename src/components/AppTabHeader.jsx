import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useTippingProgressStats } from '../hooks/useTippingProgressStats.js';
import { getTabHeaderMeta } from '../constants/navTabs.js';
import TippingProgressWidget from './TippingProgressWidget.jsx';
import RulesSheet from './RulesSheet.jsx';
import infoIcon from '../assets/info-icon.svg';

export default function AppTabHeader() {
  const { pathname } = useLocation();
  const { user, profile } = useAuth();
  const stats = useTippingProgressStats();
  const meta = getTabHeaderMeta(pathname);
  const isHome = pathname === '/';
  const [rulesOpen, setRulesOpen] = useState(false);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Du';
  const firstName =
    profile?.first_name?.trim() ||
    displayName.split(/\s+/).filter(Boolean)[0] ||
    'Du';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  if (isHome) {
    return (
      <header className="app-tab-header app-tab-header--home home-topbar">
        <Link to="/profile" className="home-profile" aria-label="Öppna profil">
          <div className="home-avatar">{initials || 'DU'}</div>
          <div>
            <div className="home-welcome">Välkommen!</div>
            <div className="home-name">{firstName}</div>
          </div>
        </Link>
        <TippingProgressWidget {...stats} />
      </header>
    );
  }

  return (
    <>
      <header className="app-tab-header app-tab-header--page">
        <button
          type="button"
          className="app-tab-info-btn"
          aria-label="Hjälp"
          onClick={() => setRulesOpen(true)}
        >
          <img src={infoIcon} alt="" />
        </button>
        <div className="app-tab-hero">
          <h1 className="app-tab-hero-title">{meta?.title}</h1>
          {meta?.subtitle ? <p className="app-tab-hero-subtitle">{meta.subtitle}</p> : null}
        </div>
        <TippingProgressWidget {...stats} />
      </header>
      <RulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </>
  );
}
