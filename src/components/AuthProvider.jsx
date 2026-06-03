import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../hooks/useAuth.js';
import {
  LEGACY_LOCAL_USER_ID,
  fetchProfile,
  getSession,
  onAuthStateChange,
  sendPasswordReset,
  setPaymentAck,
  signInWithEmail,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  upsertProfile,
} from '../services/authService.js';
import { migrateLocalStorageToSupabase } from '../services/predictionsService.js';

// Derive first/last name from whatever the auth provider gave us. Email
// signup stores first_name/last_name directly; Google gives full_name/name.
function namePartsFromUser(u) {
  const meta = u?.user_metadata || {};
  if (meta.first_name) {
    return { firstName: meta.first_name, lastName: meta.last_name || '' };
  }
  const full = (meta.full_name || meta.name || '').trim();
  if (!full) return null;
  const [first, ...rest] = full.split(/\s+/);
  return { firstName: first, lastName: rest.join(' ') };
}

// Provider wires the Supabase auth session into a context so every page +
// hook reads the same user/profile and the localStorage→Supabase prediction
// migration runs exactly once on first sign-in.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the profile and, if it's missing but the user already carries a
  // name (email signup metadata or Google), create it automatically so the
  // common path skips the "complete profile" step.
  const ensureProfile = useCallback(async (u) => {
    if (!u) {
      setProfile(null);
      return null;
    }
    let p = await fetchProfile(u.id);
    if (!p) {
      const parts = namePartsFromUser(u);
      if (parts?.firstName) {
        try {
          p = await upsertProfile(u.id, { ...parts, email: u.email });
        } catch {
          /* fall through to the CompleteProfile screen */
        }
      }
    } else if (u.email && !p.email) {
      try {
        p = await upsertProfile(u.id, {
          displayName: p.display_name,
          email: u.email,
        });
      } catch {
        /* non-fatal */
      }
    }
    setProfile(p);
    return p;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const session = await getSession();
      if (!mounted) return;
      setUser(session.user);
      if (session.user) await ensureProfile(session.user);
      setLoading(false);
    })();

    const unsub = onAuthStateChange(async (u) => {
      setUser(u);
      if (u) {
        await ensureProfile(u);
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
  }, [ensureProfile]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signInWithEmail,
      signInWithGoogle,
      signInWithPassword,
      signUpWithPassword,
      sendPasswordReset,
      signOut,
      saveProfile: async ({ firstName, lastName }) => {
        if (!user) return null;
        const p = await upsertProfile(user.id, { firstName, lastName });
        setProfile(p);
        return p;
      },
      acknowledgePayment: async () => {
        if (!user) return null;
        const p = await setPaymentAck(user.id);
        setProfile(p);
        return p;
      },
    }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
