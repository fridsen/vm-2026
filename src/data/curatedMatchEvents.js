// Goal timelines used when match_events sync is unavailable (e.g. api-football
// free tier lacks WC 2026). Verified against official match reports.

/** @type {Record<string, Array<{ minute: number, type: string, team: 'home'|'away', player: string|null, detail: string }>>} */
export const curatedMatchEvents = {
  'H-R2-M1': [
    { minute: 11, type: 'goal', team: 'home', player: 'Lamine Yamal', detail: '1–0' },
    { minute: 22, type: 'goal', team: 'home', player: 'Mikel Oyarzabal', detail: '2–0' },
    { minute: 24, type: 'goal', team: 'home', player: 'Mikel Oyarzabal', detail: '3–0' },
    {
      minute: 49,
      type: 'goal',
      team: 'home',
      player: 'Hassan Tambakti',
      detail: '4–0 · självmål',
    },
  ],
};

export function curatedEventsForMatch(matchId) {
  return curatedMatchEvents[matchId] ?? [];
}
