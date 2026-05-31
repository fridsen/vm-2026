// Auto-beräkna 1X2-tecken från hem/borta-mål.
// 1 = hemmavinst, X = oavgjort, 2 = bortavinst.

export function signFromScore(home, away) {
  if (home == null || away == null || home === '' || away === '') return null;
  const h = Number(home);
  const a = Number(away);
  if (Number.isNaN(h) || Number.isNaN(a)) return null;
  if (h > a) return '1';
  if (h < a) return '2';
  return 'X';
}
