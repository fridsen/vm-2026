// useAuth — single source of truth for the current user across the app.
// Components call useAuth() and rely on `user.id` / `profile.display_name`.
// Consumed via the AuthProvider in src/components/AuthProvider.jsx so that
// every consumer reads the same session state without re-subscribing.

import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
