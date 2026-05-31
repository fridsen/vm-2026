import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const ICON_HOME = (
  <>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </>
);
const ICON_GAMES = (
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 000 20M2 12h20" />
    <path d="M12 2a14.5 14.5 0 010 20" />
  </>
);
const ICON_GROUPS = (
  <>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </>
);
const ICON_PLAYOFFS = (
  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
);
const ICON_STATS = (
  <>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </>
);
const ICON_BOARD = (
  <>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </>
);

const NAV_ITEMS = [
  { to: '/', label: 'Hem', end: true, icon: ICON_HOME },
  { to: '/matcher', label: 'Matcher', icon: ICON_GAMES },
  { to: '/grupper', label: 'Grupper', icon: ICON_GROUPS },
  { to: '/slutspel', label: 'Slutspel', icon: ICON_PLAYOFFS },
  { to: '/skytteliga', label: 'Skytte', icon: ICON_STATS },
  { to: '/leaderboard', label: 'Topp', icon: ICON_BOARD },
];

function NavIcon({ children, active }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke={active ? '#FFFFFF' : '#9497B0'}
      className="transition-colors"
    >
      {children}
    </svg>
  );
}

export function DesktopNav() {
  return (
    <aside className="shadow-card hidden w-64 shrink-0 border-r border-black/5 bg-surface md:flex md:flex-col">
      <div className="p-6">
        <div className="font-display text-2xl uppercase tracking-[0.06em] text-neutral-900">
          VM-TIPSET
        </div>
        <div className="mt-0.5 text-xs font-medium text-neutral-500">
          2026 · USA/CAN/MEX
        </div>
      </div>
      <nav className="flex flex-col gap-1.5 px-3 pb-6">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-neutral-500 hover:bg-black/5 hover:text-neutral-900',
              )
            }
          >
            {({ isActive }) => (
              <>
                <NavIcon active={isActive}>{item.icon}</NavIcon>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function MobileBottomNav({ alwaysVisible = false }) {
  return (
    <nav
      className={clsx(
        'pointer-events-none fixed inset-x-0 bottom-2.5 z-20 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2',
        !alwaysVisible && 'md:hidden',
      )}
    >
      <div className="shadow-nav pointer-events-auto mx-auto flex max-w-lg items-center justify-around gap-1 rounded-3xl border border-black/[0.04] bg-surface px-2 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex min-w-[52px] flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[10px] font-semibold tracking-wide transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-neutral-400 hover:text-neutral-600',
              )
            }
          >
            {({ isActive }) => (
              <>
                <NavIcon active={isActive}>{item.icon}</NavIcon>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
