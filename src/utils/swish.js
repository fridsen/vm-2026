/** Normalize Swedish mobile / Swish number to digits (46…). */
export function normalizeSwishNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('46')) return digits;
  if (digits.startsWith('0')) return `46${digits.slice(1)}`;
  return digits;
}

/**
 * Prefilled P2P payment via Swish's app link (opens Swish on mobile).
 * @see https://app.swish.nu/1/p/sw/
 */
export function buildSwishPayUrl({ phone, amountSek, message } = {}) {
  const sw = normalizeSwishNumber(phone);
  if (!sw) return null;

  const params = new URLSearchParams();
  params.set('sw', sw);
  params.set('cur', 'SEK');
  params.set('src', 'app');

  const amount = Number(amountSek);
  if (Number.isFinite(amount) && amount > 0) {
    params.set('amt', String(Math.round(amount)));
    params.set('edit', 'msg');
  } else {
    params.set('edit', 'amt,msg');
  }

  if (message) {
    params.set('msg', String(message).slice(0, 50));
  }

  return `https://app.swish.nu/1/p/sw/?${params.toString()}`;
}
