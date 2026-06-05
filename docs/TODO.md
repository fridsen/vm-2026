# TODO

## Active

- [ ] Design — polish UI innan nya features går live

## Upcoming

- **Lag- och spelardata (Zafronix)** — `TeamDetailSheet` + `PlayerDetailSheet`, trupp/klickbara spelare från Zafronix VM 2026. Backend + sync klart och testat; designpass innan live. Återställ: `git stash list` → `git stash pop` (stash: *lag/spelardata*). Se `docs/api-football-sketch.md` i stashen.
- Leaderboard
- ~~Backup everyones predictions on deadline~~ (cron: `vm2026_deadline_tick` — verify dry_run ~8 Jun)
- Add live match data
- Add live leaderboard toggle
- Fäst på hemskärmen — prompt av (`ADD_TO_HOME_PROMPT_ENABLED` i `iosInstall.js`); koordinera med app-onboarding

## Done

- Onboarding till min tips sida (ersatt av app-onboarding på Hem)
- Onboarding till prediction sheet
