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

### Match-analys

Tippnings-bottomsheeten visar en kort svensk analys av matchen. Gruppspelsmatcher
har handskriven text i `src/data/matchAnalysis.js` (matchad via lagkoder).
Övriga matcher (t.ex. slutspel) får en deterministisk mall från
`src/utils/aiAnalysis.js` — ingen AI, inga externa odds-API:er.

## Arkitektur

```
src/
  components/   # Delade UI-komponenter (Layout, NavBar, MatchCard, LockBadge, ScoreInput)
  pages/        # En fil per vy (sex vyer)
  data/         # Statisk team-metadata + kuraterad matchanalys
  services/     # Dataaccess mot Supabase
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
