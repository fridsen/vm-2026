// Lightweight haptic feedback via the Web Vibration API.
//
// IMPORTANT: iOS Safari does NOT implement navigator.vibrate, so every call
// here is a silent no-op on iPhone/iPad browsers. Android Chrome and some
// other engines do support it. For real, reliable iOS haptics the app would
// need a native shell (e.g. Capacitor's @capacitor/haptics).

const canVibrate =
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

function vibrate(pattern) {
  if (!canVibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* vibration can throw if blocked by the UA; ignore */
  }
}

// Semantic helpers — durations (ms) loosely mirror iOS UIFeedbackGenerator
// styles so the intent is clear at call sites.
export const haptics = {
  /** Discrete selection tick — steppers, toggles, picking a tecken. */
  selection: () => vibrate(10),
  /** Light impact — navigation between games. */
  light: () => vibrate(8),
  /** Medium impact — dismissing the sheet. */
  medium: () => vibrate(18),
  /** Success notification — a prediction was saved. */
  success: () => vibrate([12, 40, 18]),
  /** Warning/error notification — a blocked or invalid action. */
  error: () => vibrate([24, 50, 24]),
};
