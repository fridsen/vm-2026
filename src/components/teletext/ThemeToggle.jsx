import clsx from 'clsx';
import { THEMES, useTheme } from '../../hooks/useTheme.js';
import wcLogo from '../../assets/wc2026-logo.png';

function TeletextSwitcherIcon() {
  return (
    <svg className="theme-switcher__teletext-icon" viewBox="0 0 16 16" aria-hidden>
      <rect width="16" height="16" rx="4" fill="#000" />
      <rect x="4" y="3" width="8" height="1" fill="#fff" />
      <rect x="4" y="6" width="8" height="1" fill="#fff" />
      <rect x="4" y="9" width="8" height="1" fill="#fff" />
      <rect x="4" y="12" width="8" height="1" fill="#fff" />
    </svg>
  );
}

/** Teletext header — always yellow BYT label (Figma). */
export default function ThemeToggle({ className }) {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label="Byt till standardvy"
    >
      BYT
    </button>
  );
}

/** Default app header — pill switcher with WC / teletext icons (Figma). */
export function DefaultThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();
  const isDefault = theme === THEMES.DEFAULT;

  return (
    <div className={clsx('theme-switcher', className)} role="group" aria-label="Byt vy">
      <button
        type="button"
        className={clsx('theme-switcher__option', isDefault && 'is-active')}
        aria-label="Standardvy"
        aria-pressed={isDefault}
        onClick={() => setTheme(THEMES.DEFAULT)}
      >
        <img src={wcLogo} alt="" />
      </button>
      <button
        type="button"
        className={clsx('theme-switcher__option', !isDefault && 'is-active')}
        aria-label="Teletextvy"
        aria-pressed={!isDefault}
        onClick={() => setTheme(THEMES.TELETEXT)}
      >
        <TeletextSwitcherIcon />
      </button>
    </div>
  );
}
