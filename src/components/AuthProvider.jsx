import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../hooks/useAuth.js';
import {
  LEGACY_LOCAL_USER_ID,
  fetchProfile,
  getSession,
  onAuthStateChange,
  signInWithEmail,
  signOut,
  upsertProfile,
} from '../services/authService.js';
import { migrateLocalStorageToSupabase } from '../services/predictionsService.js';

// Provider wires the Supabase auth session into a context so every page +
// hook reads the same user/profile and the localStorage→Supabase prediction
// migration runs exactly once on first sign-in.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null);
      return null;
    }
    const p = await fetchProfile(uid);
    setProfile(p);
    return p;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const session = await getSession();
      if (!mounted) return;
      setUser(session.user);
      if (session.user) await refreshProfile(session.user.id);
      setLoading(false);
    })();

    const unsub = onAuthStateChange(async (u) => {
      setUser(u);
      if (u) {
        await refreshProfile(u.id);
        // First-login migration of any prototype-era localStorage predictions.
        try {
          await migrateLocalStorageToSupabase(LEGACY_LOCAL_USER_ID, u.id);
        } catch (err) {
          console.warn('[auth] localStorage migration failed:', err.message);
        }
      } else {
        setProfile(null);
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [refreshProfile]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signInWithEmail,
      signOut,
      saveDisplayName: async (name) => {
        if (!user) return null;
        const p = await upsertProfile(user.id, name);
        setProfile(p);
        return p;
      },
    }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
