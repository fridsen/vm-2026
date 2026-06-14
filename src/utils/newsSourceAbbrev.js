const SOURCE_ABBREVS = {
  aftonbladet: 'AB',
  'aftonbladet sport': 'AB',
  expressen: 'EXP',
  'expressen sport': 'EXP',
  fotbollskanalen: 'FBK',
  svt: 'SVT',
  'svt sport': 'SVT',
  dn: 'DN',
  'dagens nyheter': 'DN',
};

function normalizeSource(source) {
  return String(source ?? '')
    .trim()
    .toLowerCase();
}

/** Teletext-style source label (max 3 chars) for news rows. */
export function abbreviateNewsSource(source) {
  const key = normalizeSource(source);
  if (SOURCE_ABBREVS[key]) return SOURCE_ABBREVS[key];
  if (!key) return '???';
  const compact = key.replace(/[^a-z0-9]/g, '').toUpperCase();
  return compact.slice(0, 3) || '???';
}
