// FIFA 3-letter team codes → flag emoji.
//
// football-data.org stores TLAs (often FIFA codes, not ISO). Most map to a
// standard ISO 3166-1 alpha-2 pair rendered as regional-indicator symbols.
// UK home nations and a few edge cases use explicit overrides.

/** @type {Record<string, string>} */
const SPECIAL = {
  ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  NIR: '🏴󠁧󠁢󠁮󠁩󠁲󠁿',
};

/** FIFA / football TLA → ISO 3166-1 alpha-2 */
/** @type {Record<string, string>} */
const FIFA_TO_ISO2 = {
  ALG: 'DZ',
  ARG: 'AR',
  AUS: 'AU',
  AUT: 'AT',
  BEL: 'BE',
  BIH: 'BA',
  BRA: 'BR',
  CAN: 'CA',
  CHI: 'CL',
  CIV: 'CI',
  CMR: 'CM',
  COL: 'CO',
  COD: 'CD',
  CPV: 'CV',
  CRC: 'CR',
  CRO: 'HR',
  CUW: 'CW',
  CZE: 'CZ',
  DEN: 'DK',
  ECU: 'EC',
  EGY: 'EG',
  ESP: 'ES',
  FRA: 'FR',
  GER: 'DE',
  GHA: 'GH',
  GRE: 'GR',
  HAI: 'HT',
  IRN: 'IR',
  IRQ: 'IQ',
  ITA: 'IT',
  JAM: 'JM',
  JOR: 'JO',
  JPN: 'JP',
  KOR: 'KR',
  KSA: 'SA',
  MAR: 'MA',
  MEX: 'MX',
  NED: 'NL',
  NGA: 'NG',
  NOR: 'NO',
  NZL: 'NZ',
  PAN: 'PA',
  PAR: 'PY',
  POL: 'PL',
  POR: 'PT',
  QAT: 'QA',
  RSA: 'ZA',
  SEN: 'SN',
  SRB: 'RS',
  SUI: 'CH',
  SWE: 'SE',
  TUN: 'TN',
  TUR: 'TR',
  URU: 'UY',
  URY: 'UY',
  USA: 'US',
  UZB: 'UZ',
};

function iso2ToFlag(iso2) {
  return [...iso2.toUpperCase()].map((c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0)),
  ).join('');
}

/** Resolve a flag emoji for a FIFA-style 3-letter team code. */
export function flagForCode(code) {
  if (!code) return '🏳';
  const key = code.toUpperCase();
  if (SPECIAL[key]) return SPECIAL[key];
  const iso2 = FIFA_TO_ISO2[key];
  if (iso2) return iso2ToFlag(iso2);
  return '🏳';
}
