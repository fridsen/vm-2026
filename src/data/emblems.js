// SVG national-team emblems, resolved by FIFA 3-letter code.
//
// SVGs live in `src/assets/emblems/` and are imported eagerly as URLs by Vite.
// `CODE_TO_EMBLEM` maps a FIFA code to a filename; codes without an emblem
// resolve to `null` so callers can fall back to the emoji flag.

const emblemUrls = import.meta.glob('../assets/emblems/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

// Filename (basename) -> imported URL.
const byFilename = {};
for (const [path, url] of Object.entries(emblemUrls)) {
  const file = path.split('/').pop();
  byFilename[file] = url;
}

/** @type {Record<string, string>} FIFA code -> emblem filename */
const CODE_TO_EMBLEM = {
  ALG: 'algeria-national-team-footballlogos-org.svg',
  ARG: 'argentina-national-team-footylogos.svg',
  AUS: 'australia-national-team-footylogos.svg',
  AUT: 'austria-national-team-footballlogos-org.svg',
  BEL: 'belgium-national-team-footballlogos-org.svg',
  BIH: 'bosnia-and-herzegovina-footballlogos-org.svg',
  BRA: 'brazil-national-team-footballlogos-org.svg',
  CPV: 'cabo-verde-footballlogos-org.svg',
  CAN: 'canada-national-team-footballlogos-org.svg',
  COL: 'colombia-national-team-footballlogos-org.svg',
  CIV: 'cote-d-ivoire-national-team-footballlogos-org.svg',
  CRO: 'croatia-national-team-footballlogos-org.svg',
  CUW: 'curacao-national-team-footballlogos-org.svg',
  CZE: 'czechia-national-team-footballlogos-org.svg',
  COD: 'dr-congo-footballlogos-org.svg',
  ECU: 'ecuador-national-team-footballlogos-org.svg',
  EGY: 'egypt-national-team-footballlogos-org.svg',
  ENG: 'england-national-team-footballlogos-org.svg',
  FRA: 'france-national-team-footballlogos-org.svg',
  GER: 'germany-national-team-footballlogos-org.svg',
  GHA: 'ghana-national-team-footylogos.svg',
  HAI: 'haiti-national-team-footylogos.svg',
  IRN: 'iran-national-team-footballlogos-org.svg',
  IRQ: 'iraq-footballlogos-org.svg',
  JPN: 'japan-national-team-footballlogos-org.svg',
  JOR: 'jordan-footballlogos-org.svg',
  MEX: 'mexico-national-team-footballlogos-org.svg',
  MAR: 'morocco-national-team-footballlogos-org.svg',
  NED: 'netherlands-dutch-national-team-footballlogos-org.svg',
  NZL: 'new-zealand-national-team-footballlogos-org.svg',
  NOR: 'norway-national-team-footballlogos-org.svg',
  PAN: 'panama-national-team-footballlogos-org.svg',
  PAR: 'paraguay-national-team-footballlogos-org.svg',
  POR: 'portugal-national-team-footballlogos-org.svg',
  QAT: 'qatar-national-team-footballlogos-org.svg',
  KSA: 'saudi-arabia-national-team-footballlogos-org.svg',
  SCO: 'scotland-national-team-footballlogos-org.svg',
  SEN: 'senegal-national-team-footballlogos-org.svg',
  RSA: 'south-africa-national-team-footballlogos-org.svg',
  KOR: 'south-korea-national-team-footballlogos-org.svg',
  ESP: 'spain-national-team-footballlogos-org.svg',
  SWE: 'sweden-national-team-footballlogos-org.svg',
  SUI: 'swiss-national-team-footballlogos-org.svg',
  TUN: 'tunisia-national-team-footballlogos-org.svg',
  TUR: 'turkey-national-team-footballlogos-org.svg',
  URU: 'uruguay-national-team-footballlogos-org.svg',
  URY: 'uruguay-national-team-footballlogos-org.svg',
  USA: 'usa-national-team-footballlogos-org.svg',
  UZB: 'uzbekistan-national-team-footballlogos-org.svg',
};

/** Resolve an emblem SVG URL for a FIFA code, or `null` if none exists. */
export function emblemForCode(code) {
  if (!code) return null;
  const file = CODE_TO_EMBLEM[code.toUpperCase()];
  return (file && byFilename[file]) || null;
}
