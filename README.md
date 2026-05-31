# VM-tipset 2026

Tipps-app för fotbolls-VM 2026 (USA / Kanada / Mexiko).
Byggd med React + Vite + Tailwind CSS. Backend: Supabase (Postgres + Auth +
Edge Functions). Live-fixtures, resultat och skytteliga synkas från ett
fotboll-API in i Postgres via en cron-schemalagd Edge Function — se
[supabase/README.md](supabase/README.md) för operativ checklista.

## Kör lokalt

```bash
npm install
cp .env.example .env.local      # fyll i VITE_SUPABASE_*
npm run dev
```

Öppna http://localhost:5173. Appen kräver att Supabase-projektet är på
plats med migrationerna i `supabase/migrations/` applicerade — utan
giltiga `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` startar inte
klienten.

### Live odds + LLM-analys (frivilligt)

Tippnings-bottomsheeten visar en AI-analys av matchen. Som standard är den
deterministiskt genererad från lag-IDn (mock). Två oberoende API-nycklar
uppgraderar UI:t progressivt:

| Nyckel | Vad den ger | Tier |
|---|---|---|
| `VITE_ODDS_API_KEY` ([the-odds-api.com](https://the-odds-api.com/)) | Riktiga 1X2-sannolikheter från bookmakers (margin borträknad) | Gratis 500 anrop/mån |
| `VITE_OPENAI_API_KEY` ([platform.openai.com](https://platform.openai.com/api-keys)) | Riktig svensk prosa-analys per match (gpt-4o-mini) | ~$0.05 / full turnering |

```bash
cp .env.example .env.local
# Fyll i en eller båda nycklarna
```

**Caching:** WC-odds-payloaden cachas en timme i `localStorage`; LLM-analyser
per matchup cachas 24 timmar. Båda har graceful fallback till mock-data om
nyckel saknas eller anropet misslyckas.

> ⚠️ Vite bundlar in `VITE_*`-variabler i klient-buildet — nycklarna blir
> synliga för alla som inspekterar JS:en. För publik produktion: lägg en
> proxy-server framför som håller nycklarna serverside.

## Arkitektur

```
src/
  components/   # Delade UI-komponenter (Layout, NavBar, MatchCard, LockBadge, ScoreInput)
  pages/        # En fil per vy (sex vyer)
  data/         # Statisk team-metadata (lag-id, gruppindelning, profile-strängar för LLM)
  services/     # All dataaccess mot Supabase + 3:e parts API:er (odds, LLM)
  hooks/        # React-hooks som wrappar services (useAuth, useMatches, usePredictions, useLockState, ...)
  utils/        # Rena funktioner: scoring, lockRules, signFromScore
supabase/
  migrations/   # SQL-migrationer (schema, RLS, lockregler, cron)
  functions/    # Edge Functions, just nu en: sync-fixtures
```

### Service-lagret

UI och hooks går alltid via `services/`-filerna. Tabellerna `teams`,
`matches`, `knockout_matches`, `players`, `topscorers`, `predictions` och
vyn `leaderboard` är källorna; sync-funktionen håller dem aktuella.

## Poängsystem

| Kategori | Regler | Max |
|---|---|---|
| Gruppmatch | Tecken 2p · Hemmamål 1p · Bortamål 1p · Bonus 1p (allt rätt) | 5p × 72 = 360p |
| Gruppslutställning | Vinnare 2p · Tvåa 1p · Trea 1p · Bonus alla fyra rätt 2p | 6p × 12 = 72p |
| R32 (sextondelsfinal) | 2p per lag vidare | 32p |
| R16 (åttondelsfinal) | 3p per lag vidare | 24p |
| Kvartsfinal | 3p per lag vidare | 12p |
| Semifinal | 4p per lag vidare | 8p |
| Bronsmatch | Rätt vinnare 5p | 5p |
| Final | Rätt finalist 5p/lag · Rätt VM-vinnare 15p | 25p |
| Skytteliga | 10/6/3 + bonus 3p (valfri ordning) eller 6p (rätt ordning) | 25p |

Alla poängfunktioner finns i [`src/utils/scoring.js`](src/utils/scoring.js)
och returnerar `{ points, breakdown }` för UI-transparens.

## Låsregler

- **Globalt lås** vid första gruppspelsmatchen: låser alla 72 matcher,
  gruppslutställning, VM-vinnare och skytteliga.
- **Slutspelet öppnar progressivt**: R32 när sista gruppomgången startar,
  sedan öppnar varje rond när föregående är klar.
- Varje slutspelsrond låses vid avspark av rondens första match.

Logiken ligger i [`src/utils/lockRules.js`](src/utils/lockRules.js) och
exponeras via [`useLockState`](src/hooks/useLockState.js).

## Status

- [x] Projektstruktur + Tailwind + Router
- [x] Poäng- och låslogik (klient + server-side via RLS)
- [x] Services + hooks
- [x] Dashboard (poäng, placering, nästa match, deadline-countdown, kategori-status)
- [x] Matcher-vy (alla 72 matcher grupperade A-L med flikar, tippformulär, auto-tecken)
- [x] Leaderboard
- [x] Supabase-integration (Auth, RLS-låsning, sync-funktion)
- [ ] Gruppslutställning (placeholder)
- [ ] Slutspel bracket-vy (placeholder)
- [ ] Skytteliga (placeholder)

## Nästa steg

1. Bygg Gruppslutställning-vyn (drag-and-drop ordning per grupp).
2. Bygg slutspel-bracket med progressivt upplåsta ronder.
3. Bygg Skytteliga-vyn (välj 3 spelare ur `topscorers`).
4. Flytta de sista direkta `data/teams.js`-importerna i UI till en cachad
   `useTeams()`-hook så hela `src/data/` kan tas bort.
