import { useCallback, useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../components/teletext/ThemeProvider.jsx';

const KEY = 'vm-theme';
export const THEMES = {
  DEFAULT: 'default',
  TELETEXT: 'teletext',
};

export function readStoredTheme() {
  if (typeof window === 'undefined') return THEMES.DEFAULT;
  const stored = window.localStorage?.getItem(KEY);
  return stored === THEMES.TELETEXT ? THEMES.TELETEXT : THEMES.DEFAULT;
}

export function writeStoredTheme(theme) {
  if (typeof window === 'undefined') return;
  if (theme === THEMES.TELETEXT) {
    window.localStorage.setItem(KEY, THEMES.TELETEXT);
  } else {
    window.localStorage.removeItem(KEY);
  }
}

export function useThemeState() {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    writeStoredTheme(theme);
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === THEMES.TELETEXT ? '#000000' : '#f5f4f9');
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(typeof next === 'function' ? next : () => next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) =>
      current === THEMES.TELETEXT ? THEMES.DEFAULT : THEMES.TELETEXT,
    );
  }, []);

  return { theme, setTheme, toggleTheme };
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
