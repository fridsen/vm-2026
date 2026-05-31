// LLM-powered match analysis via OpenAI's chat completions API.
//
// "Grounded" mode: we feed the model real, curated facts about each team
// (playing style + historical identity, from `data/teamProfiles.js`) plus
// the actual bookmaker-implied probabilities, and we LOCK the prompt down
// so the model can only reason from those facts + the odds. No invented
// player names, no fabricated recent results, no made-up tactical claims.
//
// Result is cached per-matchup in localStorage with a 24h TTL.
//
// API key from `import.meta.env.VITE_OPENAI_API_KEY`. If unset, callers
// fall back to the deterministic templated analysis from `aiAnalysis.js`.
//
// SECURITY: Vite inlines VITE_* into the client bundle. The key is
// visible to anyone who inspects the deployed JS. For a public production
// build, front this with a small backend proxy.

import { getTeamProfile } from '../data/teamProfiles.js';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';
// Bump cache prefix when the prompt or model changes — this invalidates
// any previously-cached (and potentially less grounded) responses.
const CACHE_PREFIX = 'vm-llm-analysis-v2:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export function getApiKey() {
  return import.meta.env?.VITE_OPENAI_API_KEY || '';
}

export function isLlmEnabled() {
  return Boolean(getApiKey());
}

function cacheKey(home, away) {
  return `${CACHE_PREFIX}${home.id}-${away.id}`;
}

function readCache(home, away) {
  try {
    const raw = localStorage.getItem(cacheKey(home, away));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.analysis) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.analysis;
  } catch {
    return null;
  }
}

function writeCache(home, away, analysis) {
  try {
    localStorage.setItem(
      cacheKey(home, away),
      JSON.stringify({ analysis, fetchedAt: Date.now(), model: MODEL }),
    );
  } catch {
    // Quota / private mode — ignore, we'll just refetch next time.
  }
}

// Dedupe identical in-flight requests so multiple sheets opened in quick
// succession don't double-call the API for the same matchup.
const inflight = new Map();

// Determine a recommendation directly from the probability split so the
// model's wording always matches the actual numbers (it can't recommend
// the wrong side by accident).
function recommendationFromProbs(probs, home, away) {
  const top = Math.max(probs.homeWin, probs.draw, probs.awayWin);
  if (top === probs.homeWin) return `${home.name}-vinst`;
  if (top === probs.awayWin) return `${away.name}-vinst`;
  return 'Oavgjort';
}

function gapDescriptor(probs) {
  const sorted = [probs.homeWin, probs.draw, probs.awayWin].sort((a, b) => b - a);
  const gap = sorted[0] - sorted[1];
  if (gap >= 25) return 'tydlig favorit';
  if (gap >= 12) return 'måttlig favorit';
  if (gap >= 5) return 'svag favorit';
  return 'extremt jämn match';
}

function buildPrompt(home, away, probs, context = {}) {
  const { group, round } = context;
  const groupBit = group ? `Grupp ${group}` : 'gruppspel';
  const roundBit = round ? `, omgång ${round}` : '';

  const homeProfile = getTeamProfile(home.id);
  const awayProfile = getTeamProfile(away.id);

  const profileBlock = (team, profile) => {
    if (!profile) return `- ${team.name} (${team.code}): inga ytterligare profil-fakta tillgängliga.`;
    return `- ${team.name} (${team.code})\n    Spelstil: ${profile.style}\n    Identitet: ${profile.identity}`;
  };

  const recommendation = recommendationFromProbs(probs, home, away);
  const gap = gapDescriptor(probs);

  return `Skriv en kort, grundad analys på svenska för en fotbolls-VM 2026-match.

KONTEXT
${groupBit}${roundBit} · ${home.name} (${home.code}) vs ${away.name} (${away.code})

ENDA TILLÅTNA FAKTAKÄLLOR
Bookmakers sannolikheter (de är facit för marknadens bedömning):
  ${home.code} vinst: ${probs.homeWin}%
  Oavgjort: ${probs.draw}%
  ${away.code} vinst: ${probs.awayWin}%
  → Sammanfattning: ${gap}.
  → Rekommendation som följer av oddsen: ${recommendation}.

Lagprofiler (ENDAST dessa fakta får refereras om lagen):
${profileBlock(home, homeProfile)}
${profileBlock(away, awayProfile)}

REGLER (mycket viktiga, följ alla)
1. Använd ENDAST faktakällorna ovan. Hitta INTE på andra fakta.
2. Nämn ALDRIG specifika spelarnamn (t.ex. ingen Messi, Mbappé, Haaland, etc.).
3. Hänvisa ALDRIG till specifika nyligen spelade matcher, resultat eller skadelistor — du har inte den datan.
4. Beskriv lagens styrkor och spelsätt med utgångspunkt i lagprofilerna ovan, inte i påhittade detaljer.
5. Använd procentsiffrorna direkt (t.ex. "marknaden ger ${home.code} ${probs.homeWin}% chans") — det är konkret och verifierbart.
6. Avsluta med exakt rekommendationen som följer av oddsen: "${recommendation}".
7. Skriv 3–4 flytande meningar, max ~70 ord. Prosa, inga punktlistor, ingen rubrik, inget prefix som "Analys:".
8. Var saklig. Undvik klyschor som "spännande match" eller "alla kan vinna".`;
}

async function doFetch(home, away, probs, context, signal) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Du är en saklig svensk fotbollsanalytiker som skriver korta ' +
            'matchpreviews. Du arbetar STRIKT inom de fakta som användaren ' +
            'ger dig — bookmaker-sannolikheter och korta lagprofiler. Du ' +
            'hittar ALDRIG på spelarnamn, resultat eller skadelistor du ' +
            'inte fått. Om datan inte räcker för en specifik observation, ' +
            'håll dig till det generella. Faktatrohet går alltid före ' +
            'färgstark prosa.',
        },
        { role: 'user', content: buildPrompt(home, away, probs, context) },
      ],
      // Lower temperature → less creative invention, more grounded output.
      temperature: 0.3,
      max_tokens: 280,
    }),
  });

  if (!res.ok) {
    let msg = `OpenAI ${res.status}`;
    try {
      const err = await res.json();
      msg += `: ${err?.error?.message || res.statusText}`;
    } catch {
      msg += `: ${res.statusText}`;
    }
    throw new Error(msg);
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content?.trim() || '';
  if (text.length < 20) throw new Error('OpenAI returned empty/too-short text');
  return text;
}

/**
 * Get an LLM-generated Swedish analysis of a matchup.
 * Returns cached result if available, otherwise calls OpenAI.
 *
 * Returns `null` (and never throws) if the LLM is disabled, fails, or is
 * aborted — callers fall back to the templated `buildAnalysis`.
 */
export async function fetchLlmAnalysis(home, away, probs, context = {}, { signal } = {}) {
  if (!home || !away || !probs || !isLlmEnabled()) return null;

  const cached = readCache(home, away);
  if (cached) return cached;

  const key = cacheKey(home, away);
  if (inflight.has(key)) {
    try {
      return await inflight.get(key);
    } catch {
      return null;
    }
  }

  const promise = doFetch(home, away, probs, context, signal)
    .then((text) => {
      writeCache(home, away, text);
      return text;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);

  try {
    return await promise;
  } catch (err) {
    if (err?.name !== 'AbortError') {
      console.warn('[llmAnalysis] fetch failed:', err.message);
    }
    return null;
  }
}
