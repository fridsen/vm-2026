import { useAppUpdateCheck } from '../hooks/useAppUpdateCheck.js';
import { haptics } from '../utils/haptics.js';

export default function AppUpdatePrompt() {
  const { updateAvailable, dismiss, reload } = useAppUpdateCheck();
  if (!updateAvailable) return null;

  return (
    <div
      className="fixed left-4 right-4 z-[56] mx-auto max-w-lg rounded-2xl border border-black/10 bg-surface p-4 shadow-card md:left-auto md:right-8"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
      role="status"
    >
      <p className="text-sm font-semibold text-neutral-900">Ny version tillgänglig</p>
      <p className="mt-1 text-sm text-neutral-600">
        Uppdatera appen för att få senaste ändringarna.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white"
          onClick={() => {
            haptics.light();
            reload();
          }}
        >
          Uppdatera
        </button>
        <button
          type="button"
          className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-bold text-neutral-700"
          onClick={() => {
            haptics.light();
            dismiss();
          }}
        >
          Senare
        </button>
      </div>
    </div>
  );
}
