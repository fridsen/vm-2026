import { useCallback, useMemo, useState } from 'react';
import {
  getIosInstallBrowser,
  isStandaloneDisplay,
  readA2hsPromptDismissed,
  readA2hsSnoozedSession,
  shouldOfferAddToHomeScreen,
  writeA2hsPromptDismissed,
  writeA2hsSnoozedSession,
} from '../utils/iosInstall.js';

export function useAddToHomeScreen() {
  const [dismissed, setDismissed] = useState(() => readA2hsPromptDismissed());
  const [snoozed, setSnoozed] = useState(() => readA2hsSnoozedSession());

  const iosBrowser = useMemo(() => getIosInstallBrowser(), []);
  const standalone = useMemo(() => isStandaloneDisplay(), []);
  const shouldOffer = useMemo(
    () => shouldOfferAddToHomeScreen({ standalone, dismissed }),
    [standalone, dismissed],
  );
  const visible = shouldOffer && !snoozed;

  const later = useCallback(() => {
    writeA2hsSnoozedSession();
    setSnoozed(true);
  }, []);

  const dismissPrompt = useCallback(() => {
    writeA2hsPromptDismissed();
    setDismissed(true);
  }, []);

  return {
    iosBrowser,
    shouldOffer,
    visible,
    later,
    dismissPrompt,
  };
}
