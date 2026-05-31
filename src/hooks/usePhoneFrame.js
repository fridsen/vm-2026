import { useCallback, useEffect, useState } from 'react';

const KEY = 'vm-phone-frame';

/**
 * Tiny global toggle for "phone-frame" preview mode. Persists in localStorage
 * so it survives reloads. Useful when looking at the app in Cursor's Simple
 * Browser (which has no device emulator).
 */
export function usePhoneFrame() {
  const [phoneFrame, setPhoneFrame] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage?.getItem(KEY) === '1';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (phoneFrame) window.localStorage.setItem(KEY, '1');
    else window.localStorage.removeItem(KEY);
  }, [phoneFrame]);

  const toggle = useCallback(() => setPhoneFrame((v) => !v), []);

  return { phoneFrame, toggle };
}
