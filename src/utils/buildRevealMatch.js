import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { formatGroupRoundLabel } from './matchMetaDisplay.js';
import { scoreGroupMatch } from './scoring.js';
import { revealVerdict } from './revealVerdict.js';
import { reconcileRevealEvents } from './matchEventMapping.js';
import { curatedEventsForMatch } from '../data/curatedMatchEvents.js';

/** Synthesize goal-only events when DB has no timeline yet. */
export function synthesizeGoalEvents(homeScore, awayScore) {
  const events = [];
  const total = homeScore + awayScore;
  if (total === 0) return events;

  let h = 0;
  let a = 0;
  const slots = [];
  for (let i = 0; i < homeScore; i += 1) slots.push('home');
  for (let i = 0; i < awayScore; i += 1) slots.push('away');

  slots.forEach((team, index) => {
    if (team === 'home') h += 1;
    else a += 1;
    const minute = Math.min(88, Math.round(((index + 1) / total) * 85) + 5);
    events.push({
      minute,
      type: 'goal',
      team,
      player: null,
      detail: `${h}–${a}`,
    });
  });

  return events;
}

/**
 * @param {object} params
 * @param {object} params.match
 * @param {object | null} params.prediction
 * @param {object | null} params.homeTeam
 * @param {object | null} params.awayTeam
 * @param {Array<{ minute: number, type: string, team: string, player: string | null, detail: string }>} [params.events]
 */
export function buildRevealMatch({
  match,
  prediction,
  homeTeam,
  awayTeam,
  events = [],
}) {
  const result = match.result ?? { home: 0, away: 0 };
  const homeScore = Number(result.home ?? 0);
  const awayScore = Number(result.away ?? 0);

  const eventSource =
    events.length > 0 ? events : curatedEventsForMatch(match.id);

  const timeline =
    eventSource.length > 0
      ? reconcileRevealEvents(eventSource, homeScore, awayScore)
      : synthesizeGoalEvents(homeScore, awayScore);

  const predHome = prediction?.home;
  const predAway = prediction?.away;
  const userPrediction =
    predHome != null && predAway != null ? `${predHome}-${predAway}` : '–';

  const scoring = scoreGroupMatch(prediction, result);

  return {
    matchId: match.id,
    home: {
      name: homeTeam?.code ?? '?',
      fullName: homeTeam?.name ?? 'Hemmalag',
      flag: homeTeam?.flag ?? '?',
    },
    away: {
      name: awayTeam?.code ?? '?',
      fullName: awayTeam?.name ?? 'Bortalag',
      flag: awayTeam?.flag ?? '?',
    },
    competition: formatGroupRoundLabel(match),
    date: match.kickoff
      ? format(new Date(match.kickoff), 'd MMMM', { locale: sv })
      : '',
    homeScore,
    awayScore,
    userPrediction,
    userPoints: scoring.points,
    verdict: revealVerdict(prediction, result),
    events: timeline,
  };
}

/** Demo payload from reference implementation (CAN vs QAT). */
export const REVEAL_DEMO_MATCH = {
  matchId: '__demo__',
  home: { name: 'CAN', fullName: 'Kanada', flag: '🇨🇦' },
  away: { name: 'QAT', fullName: 'Qatar', flag: '🏳️' },
  competition: 'Grupp D · FIFA World Cup 2026',
  date: '19 juni',
  homeScore: 6,
  awayScore: 0,
  userPrediction: '4-0',
  userPoints: 4,
  verdict: 'Rätt tecken',
  events: [
    { minute: 11, type: 'goal', team: 'home', player: 'Cyle Larin', detail: '1–0' },
    { minute: 23, type: 'goal', team: 'home', player: 'Alphonso Davies', detail: '2–0' },
    { minute: 34, type: 'yellow', team: 'away', player: 'Homam Ahmed', detail: 'Gult kort' },
    { minute: 41, type: 'goal', team: 'home', player: 'Jonathan David', detail: '3–0' },
    { minute: 45, type: 'injury', team: 'away', player: 'Akram Afif', detail: 'Bytt ut – skada' },
    { minute: 58, type: 'goal', team: 'home', player: 'Cyle Larin', detail: '4–0' },
    { minute: 71, type: 'red', team: 'away', player: 'Boualem Khoukhi', detail: 'Rött kort' },
    { minute: 79, type: 'goal', team: 'home', player: 'Stephen Eustáquio', detail: '5–0' },
    { minute: 88, type: 'goal', team: 'home', player: 'Tajon Buchanan', detail: '6–0' },
  ],
};
