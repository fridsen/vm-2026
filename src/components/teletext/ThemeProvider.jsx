import { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useThemeState } from '../../hooks/useTheme.js';
import { resolveThemeNavigation } from './themeRedirect.js';

export const ThemeContext = createContext(null);

function ThemeRedirect({ children }) {
  const { theme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const prevThemeRef = useRef(theme);

  useEffect(() => {
    const themeChanged = prevThemeRef.current !== theme;
    prevThemeRef.current = theme;

    const target = resolveThemeNavigation({
      theme,
      pathname: location.pathname,
      themeChanged,
    });

    if (target && target !== location.pathname) {
      navigate(target, { replace: true });
    }
  }, [theme, location.pathname, navigate]);

  return children;
}

export default function ThemeProvider({ children }) {
  const themeState = useThemeState();

  return (
    <ThemeContext.Provider value={themeState}>
      <ThemeRedirect>{children}</ThemeRedirect>
    </ThemeContext.Provider>
  );
}
