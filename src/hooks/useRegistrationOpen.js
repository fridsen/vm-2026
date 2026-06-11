import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';

/** Whether new account registration is still allowed (before global deadline). */
export function useRegistrationOpen() {
  const [registrationOpen, setRegistrationOpen] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('fn_registration_open').then(({ data, error }) => {
      if (cancelled) return;
      setRegistrationOpen(error ? true : Boolean(data));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    registrationOpen,
    registrationClosed: registrationOpen === false,
  };
}
