import { useCallback, useEffect, useRef, useState } from 'react';
import { hasRemoteAppUpdate } from '../utils/appUpdateCheck.js';
import { isStandaloneDisplay } from '../utils/iosInstall.js';

export const APP_UPDATE_SNOOZE_KEY = 'vm2026:appUpdateSnooze';

export function useAppUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const checkingRef = useRef(false);

  const check = useCallback(async () => {
    if (import.meta.env.DEV) return;
    if (!isStandaloneDisplay()) return;
    if (window.sessionStorage?.getItem(APP_UPDATE_SNOOZE_KEY) === '1') return;
    if (checkingRef.current) return;

    checkingRef.current = true;
    try {
      setUpdateAvailable(await hasRemoteAppUpdate());
    } catch {
      /* ignore transient network failures */
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV || !isStandaloneDisplay()) return undefined;

    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    check();

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, [check]);

  const dismiss = useCallback(() => {
    window.sessionStorage?.setItem(APP_UPDATE_SNOOZE_KEY, '1');
    setUpdateAvailable(false);
  }, []);

  const reload = useCallback(() => {
    window.location.reload();
  }, []);

  return { updateAvailable, dismiss, reload };
}
