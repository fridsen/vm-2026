import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const ICONS = {
  home: {
    transform: 'translate(3 3)',
    d: 'M1.00012 8.79451V14.1425C1.00012 15.2626 1.00012 15.823 1.21811 16.2508C1.40985 16.6272 1.71559 16.9328 2.09192 17.1246C2.51932 17.3424 3.07912 17.3424 4.19703 17.3424H13.8032C14.9211 17.3424 15.4801 17.3424 15.9075 17.1246C16.2838 16.9328 16.5906 16.6272 16.7823 16.2508C17.0001 15.8234 17.0001 15.2639 17.0001 14.1459V8.79451C17.0001 8.26017 16.9997 7.99286 16.9347 7.74422C16.8771 7.52387 16.7826 7.31535 16.6547 7.12693C16.5104 6.9143 16.3097 6.73797 15.9075 6.38611L11.1075 2.18611C10.3609 1.53283 9.98763 1.20635 9.5675 1.08211C9.19731 0.972631 8.80273 0.972631 8.43254 1.08211C8.01273 1.20626 7.63997 1.53242 6.89448 2.18472L2.09289 6.38611C1.69076 6.73798 1.49016 6.9143 1.34582 7.12693C1.21791 7.31536 1.12267 7.52387 1.06509 7.74422C1.00012 7.99286 1.00012 8.26017 1.00012 8.79451Z',
  },
  matches: {
    transform: 'translate(3 2)',
    d: 'M5 3H4.2002C3.08009 3 2.51962 3 2.0918 3.21799C1.71547 3.40973 1.40974 3.71547 1.21799 4.0918C1 4.51962 1 5.08009 1 6.2002V7M5 3H13M5 3V1M13 3H13.8002C14.9203 3 15.4796 3 15.9074 3.21799C16.2837 3.40973 16.5905 3.71547 16.7822 4.0918C17 4.5192 17 5.07899 17 6.19691V7M13 3V1M1 7V15.8002C1 16.9203 1 17.4801 1.21799 17.9079C1.40974 18.2842 1.71547 18.5905 2.0918 18.7822C2.5192 19 3.079 19 4.19691 19H13.8031C14.921 19 15.48 19 15.9074 18.7822C16.2837 18.5905 16.5905 18.2842 16.7822 17.9079C17 17.4805 17 16.9215 17 15.8036V7M1 7H17M13 15H13.002L13.002 15.002L13 15.002V15ZM9 15H9.002L9.00195 15.002L9 15.002V15ZM5 15H5.002L5.00195 15.002L5 15.002V15ZM13.002 11V11.002L13 11.002V11H13.002ZM9 11H9.002L9.00195 11.002L9 11.002V11ZM5 11H5.002L5.00195 11.002L5 11.002V11Z',
  },
  groups: {
    transform: 'translate(4 6)',
    d: 'M5 11H15M5 6H15M5 1H15M1.00195 11V11.002L1 11.002V11H1.00195ZM1.00195 6V6.002L1 6.00195V6H1.00195ZM1.00195 1V1.002L1 1.00195V1H1.00195Z',
  },
  leaderboard: {
    transform: 'translate(2 3)',
    d: 'M7.00001 8.00001V17M7.00001 8.00001H2.59961C2.03956 8.00001 1.75982 8.00001 1.5459 8.109C1.35774 8.20487 1.20487 8.35774 1.109 8.5459C1.00001 8.75982 1.00001 9.04005 1.00001 9.6001V17H7.00001M7.00001 8.00001V2.6001C7.00001 2.04005 7.00001 1.75982 7.109 1.5459C7.20487 1.35774 7.35774 1.20487 7.5459 1.109C7.75981 1.00001 8.03956 1.00001 8.59961 1.00001H11.3996C11.9597 1.00001 12.2403 1.00001 12.4542 1.109C12.6424 1.20487 12.7948 1.35774 12.8906 1.5459C12.9996 1.75982 13 2.04005 13 2.6001V5.00001M7.00001 17H13M13 17L19 17.0001V6.6001C19 6.04005 18.9996 5.75982 18.8906 5.5459C18.7948 5.35774 18.6429 5.20487 18.4548 5.109C18.2409 5.00001 17.9601 5.00001 17.4 5.00001H13M13 17V5.00001',
  },
  tips: {
    transform: 'translate(5 3)',
    d: 'M1 4.2002V13.6854C1 15.0464 1 15.7268 1.20412 16.1433C1.58245 16.9151 2.41158 17.3588 3.26367 17.2454C3.72341 17.1842 4.28964 16.8067 5.4221 16.0518L5.42482 16.0499C5.87369 15.7507 6.09815 15.6011 6.33295 15.5181C6.76421 15.3656 7.23476 15.3656 7.66602 15.5181C7.90129 15.6012 8.12664 15.7515 8.57732 16.0519C9.70978 16.8069 10.2767 17.1841 10.7364 17.2452C11.5885 17.3586 12.4176 16.9151 12.7959 16.1433C13 15.7269 13 15.0462 13 13.6854V4.19691C13 3.079 13 2.5192 12.7822 2.0918C12.5905 1.71547 12.2837 1.40974 11.9074 1.21799C11.4796 1 10.9203 1 9.8002 1H4.2002C3.08009 1 2.51962 1 2.0918 1.21799C1.71547 1.40974 1.40974 1.71547 1.21799 2.0918C1 2.51962 1 3.08009 1 4.2002Z',
  },
};

const NAV_ITEMS = [
  { to: '/', label: 'Hem', end: true, icon: ICONS.home },
  { to: '/mina-tips', label: 'Mina tips', icon: ICONS.tips },
  { to: '/matcher', label: 'Matcher', icon: ICONS.matches },
  { to: '/grupper', label: 'Tabeller', icon: ICONS.groups },
  { to: '/leaderboard', label: 'Leaderboard', icon: ICONS.leaderboard },
];

function NavIcon({ icon, className }) {
  return (
    <svg
      aria-hidden
      className={clsx('nav-icon', className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d={icon.d}
        transform={icon.transform}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
            {...(item.to === '/mina-tips' ? { 'data-onboarding-target': 'mina-tips-nav' } : {})}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-neutral-500 hover:bg-black/5 hover:text-neutral-900',
              )
            }
          >
            <NavIcon icon={item.icon} className="size-5" />
            {item.label}
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
        'app-bottom-nav',
        !alwaysVisible && 'md:hidden',
      )}
    >
      <div className="app-bottom-nav-inner">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            {...(item.to === '/mina-tips' ? { 'data-onboarding-target': 'mina-tips-nav' } : {})}
            className={({ isActive }) =>
              clsx(
                'app-bottom-nav-item',
                isActive && 'is-active',
              )
            }
          >
            <NavIcon icon={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
