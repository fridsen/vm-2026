// Swedish display names keyed by FIFA 3-letter code.
//
// The `teams` table stores English names; this map provides the Swedish
// label used throughout the (Swedish-language) UI. Unmapped codes fall
// back to the stored name via `swedishNameForCode` returning null.

/** @type {Record<string, string>} */
const SWEDISH_NAMES = {
  ALG: 'Algeriet',
  ARG: 'Argentina',
  AUS: 'Australien',
  AUT: 'Österrike',
  BEL: 'Belgien',
  BIH: 'Bosnien',
  BRA: 'Brasilien',
  CPV: 'Kap Verde',
  CAN: 'Kanada',
  CMR: 'Kamerun',
  COL: 'Colombia',
  COD: 'DR Kongo',
  CIV: 'Elfenbenskusten',
  CRC: 'Costa Rica',
  CRO: 'Kroatien',
  CUW: 'Curaçao',
  CZE: 'Tjeckien',
  DEN: 'Danmark',
  ECU: 'Ecuador',
  EGY: 'Egypten',
  ENG: 'England',
  ESP: 'Spanien',
  FRA: 'Frankrike',
  GER: 'Tyskland',
  GHA: 'Ghana',
  GRE: 'Grekland',
  HAI: 'Haiti',
  IRN: 'Iran',
  IRQ: 'Irak',
  ITA: 'Italien',
  JAM: 'Jamaica',
  JPN: 'Japan',
  JOR: 'Jordanien',
  KOR: 'Sydkorea',
  KSA: 'Saudiarabien',
  MAR: 'Marocko',
  MEX: 'Mexiko',
  NED: 'Nederländerna',
  NGA: 'Nigeria',
  NOR: 'Norge',
  NZL: 'Nya Zeeland',
  PAN: 'Panama',
  PAR: 'Paraguay',
  POL: 'Polen',
  POR: 'Portugal',
  QAT: 'Qatar',
  RSA: 'Sydafrika',
  SCO: 'Skottland',
  SEN: 'Senegal',
  SRB: 'Serbien',
  SUI: 'Schweiz',
  SWE: 'Sverige',
  TUN: 'Tunisien',
  TUR: 'Turkiet',
  URU: 'Uruguay',
  URY: 'Uruguay',
  USA: 'USA',
  UZB: 'Uzbekistan',
};

/** Swedish display name for a FIFA code, or `null` if not mapped. */
export function swedishNameForCode(code) {
  if (!code) return null;
  return SWEDISH_NAMES[code.toUpperCase()] ?? null;
}
