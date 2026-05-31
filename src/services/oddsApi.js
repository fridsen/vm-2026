// Live odds via The Odds API — https://the-odds-api.com/
//
// The free tier gives ~500 requests/month, so we aggressively cache the
// full World Cup payload in localStorage (1 hour TTL). When the tournament
// is in season, a single fetch covers all currently posted matches; when it
// isn't, the endpoint typically returns an empty array and we transparently
// fall back to the deterministic mock.
//
// API key is read from `import.meta.env.VITE_ODDS_API_KEY`. If the var is
// missing the service short-circuits to "no data" so the UI falls back
// without any network calls.
//
// SECURITY NOTE: Vite bundles `VITE_*` env vars into the client build, so
// the key is visible to anyone who inspects the JS. That's fine for a
// prototype — for a public production build you'd front this with a tiny
// proxy server that holds the key.

const SPORT_KEY = 'soccer_fifa_world_cup';
const REGION = 'eu';
const ENDPOINT = `https://api.the-odds-api.com/v4/sports/${SPORT_KEY}/odds/`;
const CACHE_KEY = 'vm-odds-cache-v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Map our 3-letter team IDs to the English names The Odds API uses.
// Adjust if the API ever returns a different spelling for a given team.
const TEAM_ID_TO_EN = {
  // A
  MEX: 'Mexico',
  POL: 'Poland',
  SEN: 'Senegal',
  UZB: 'Uzbekistan',
  // B
  CAN: 'Canada',
  BEL: 'Belgium',
  KSA: 'Saudi Arabia',
  IRQ: 'Iraq',
  // C
  ARG: 'Argentina',
  CRO: 'Croatia',
  MAR: 'Morocco',
  JOR: 'Jordan',
  // D
  USA: 'United States',
  GER: 'Germany',
  KOR: 'South Korea',
  JAM: 'Jamaica',
  // E
  FRA: 'France',
  URU: 'Uruguay',
  EGY: 'Egypt',
  CRC: 'Costa Rica',
  // F
  ESP: 'Spain',
  NED: 'Netherlands',
  CIV: 'Ivory Coast',
  AUS: 'Australia',
  // G
  POR: 'Portugal',
  SUI: 'Switzerland',
  IRN: 'Iran',
  CPV: 'Cape Verde',
  // H
  ENG: 'England',
  DEN: 'Denmark',
  CMR: 'Cameroon',
  PAN: 'Panama',
  // I
  BRA: 'Brazil',
  SRB: 'Serbia',
  ALG: 'Algeria',
  NZL: 'New Zealand',
  // J
  ITA: 'Italy',
  COL: 'Colombia',
  TUN: 'Tunisia',
  QAT: 'Qatar',
  // K
  NOR: 'Norway',
  JPN: 'Japan',
  NGA: 'Nigeria',
  PAR: 'Paraguay',
  // L
  TUR: 'Turkey',
  ECU: 'Ecuador',
  GHA: 'Ghana',
  AUT: 'Austria',
};

export function teamEnglishName(team) {
  if (!team) return null;
  return TEAM_ID_TO_EN[team.id] || team.name;
}

export function getApiKey() {
  return import.meta.env?.VITE_ODDS_API_KEY || '';
}

export function isLiveOddsEnabled() {
  return Boolean(getApiKey());
}

/**
 * Convert decimal odds → normalized probabilities (drops the bookmaker margin).
 * Returns whole-number percentages [home, draw, away] that sum to 100.
 */
function decimalOddsToProbs(homeDec, drawDec, awayDec) {
  if (!homeDec || !drawDec || !awayDec) return null;
  const inv = [1 / homeDec, 1 / drawDec, 1 / awayDec];
  const overround = inv[0] + inv[1] + inv[2];
  // Normalize so the three probs sum to 1, then convert to whole percent.
  const fairs = inv.map((x) => x / overround);
  let pct = fairs.map((p) => Math.round(p * 100));
  // Round-off correction so the three numbers always sum to exactly 100.
  const diff = 100 - (pct[0] + pct[1] + pct[2]);
  if (diff !== 0) {
    // Apply the diff to whichever bucket has the largest probability.
    const i = pct.indexOf(Math.max(...pct));
    pct[i] += diff;
  }
  return { homeWin: pct[0], draw: pct[1], awayWin: pct[2] };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(events) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ fetchedAt: Date.now(), events }),
    );
  } catch {
    // Quota / private mode — silently ignore, we'll just refetch next time.
  }
}

let inflightFetch = null;

/**
 * Fetch every currently-posted World Cup match from The Odds API and
 * normalize each into `{ home, away, commenceTime, probs: { homeWin, draw, awayWin } }`.
 *
 * Returns an empty array if the API key is missing or the request fails;
 * callers are expected to fall back to the mock generator in that case.
 */
export async function fetchWorldCupOdds({ force = false } = {}) {
  if (!isLiveOddsEnabled()) return [];

  if (!force) {
    const cached = readCache();
    if (cached) return cached.events;
  }

  if (inflightFetch) return inflightFetch;

  const url = `${ENDPOINT}?regions=${REGION}&markets=h2h&oddsFormat=decimal&apiKey=${getApiKey()}`;

  inflightFetch = fetch(url)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(
          `Odds API ${res.status}: ${res.statusText}${res.status === 401 ? ' (check VITE_ODDS_API_KEY)' : ''}`,
        );
      }
      const json = await res.json();
      if (!Array.isArray(json)) return [];

      const events = json
        .map((ev) => {
          // Pick the first bookmaker that posts an h2h market.
          const bk = ev.bookmakers?.find((b) =>
            b.markets?.some((m) => m.key === 'h2h'),
          );
          const market = bk?.markets?.find((m) => m.key === 'h2h');
          if (!market || !Array.isArray(market.outcomes)) return null;

          const homeOut = market.outcomes.find((o) => o.name === ev.home_team);
          const awayOut = market.outcomes.find((o) => o.name === ev.away_team);
          const drawOut = market.outcomes.find((o) => o.name === 'Draw');
          if (!homeOut || !awayOut || !drawOut) return null;

          const probs = decimalOddsToProbs(homeOut.price, drawOut.price, awayOut.price);
          if (!probs) return null;

          return {
            id: ev.id,
            home: ev.home_team,
            away: ev.away_team,
            commenceTime: ev.commence_time,
            probs,
            bookmaker: bk.title,
          };
        })
        .filter(Boolean);

      writeCache(events);
      return events;
    })
    .catch((err) => {
      console.warn('[oddsApi] fetch failed, falling back to mock:', err.message);
      return [];
    })
    .finally(() => {
      inflightFetch = null;
    });

  return inflightFetch;
}

/**
 * Find the API event matching this matchup (in either home/away orientation).
 * Returns `{ probs, bookmaker, swapped }` or `null` if no match.
 */
export function findOddsForMatch(events, homeTeam, awayTeam) {
  if (!events?.length || !homeTeam || !awayTeam) return null;
  const homeEn = teamEnglishName(homeTeam);
  const awayEn = teamEnglishName(awayTeam);

  // Direct orientation
  const direct = events.find((e) => e.home === homeEn && e.away === awayEn);
  if (direct) {
    return { probs: direct.probs, bookmaker: direct.bookmaker, swapped: false };
  }

  // Inverse: API has the teams the other way around → swap probabilities
  const inverse = events.find((e) => e.home === awayEn && e.away === homeEn);
  if (inverse) {
    return {
      probs: {
        homeWin: inverse.probs.awayWin,
        draw: inverse.probs.draw,
        awayWin: inverse.probs.homeWin,
      },
      bookmaker: inverse.bookmaker,
      swapped: true,
    };
  }

  return null;
}
