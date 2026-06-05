/** Remove cached Supabase auth tokens (fixes stuck iOS Safari sessions). */
export function clearSupabaseAuthStorage() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith('sb-') && key.includes('auth-token')) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* private mode / blocked storage */
  }
}
