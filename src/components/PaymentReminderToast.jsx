import { ENTRY_FEE_SEK, SWISH_NUMBER } from '../services/paymentsService.js';
import { usePaymentReminders } from '../hooks/usePaymentReminders.js';
import { buildSwishPayUrl } from '../utils/swish.js';
import { haptics } from '../utils/haptics.js';

export default function PaymentReminderToast() {
  const { reminders, dismiss } = usePaymentReminders();
  const latest = reminders[0];
  if (!latest) return null;

  const fee = ENTRY_FEE_SEK > 0 ? `${ENTRY_FEE_SEK} kr` : 'avgiften';
  const swish = SWISH_NUMBER || 'Swish-numret i appen';
  const swishUrl = buildSwishPayUrl({
    phone: SWISH_NUMBER,
    amountSek: ENTRY_FEE_SEK,
    message: 'VM-tipset',
  });

  return (
    <div
      className="fixed left-4 right-4 z-[55] mx-auto max-w-lg rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-card md:left-auto md:right-8"
      style={{ bottom: 'calc(var(--app-tab-bar-height, 72px) + env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      role="status"
    >
      <p className="text-sm font-semibold text-amber-900">Betalningspåminnelse</p>
      <p className="mt-1 text-sm text-amber-800">
        {latest.message || (
          <>
            Du är inte markerad som betald. Swisha {fee} till {swish}.
          </>
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {swishUrl ? (
          <a
            href={swishUrl}
            className="rounded-full bg-amber-800 px-3 py-1.5 text-xs font-bold text-white"
            onClick={() => haptics.light()}
          >
            Öppna Swish
          </a>
        ) : (
          <span className="rounded-full bg-amber-200 px-3 py-1.5 text-xs font-bold text-amber-900">
            Swish-nummer saknas
          </span>
        )}
        <button
          type="button"
          className="rounded-full border border-amber-400 px-3 py-1.5 text-xs font-bold text-amber-900"
          onClick={() => {
            haptics.light();
            dismiss(latest.id);
          }}
        >
          Stäng
        </button>
      </div>
    </div>
  );
}
