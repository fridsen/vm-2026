import { useMemo } from 'react';
import { useAllMatches } from '../../hooks/useMatches.js';
import { useLeaderboard } from '../../hooks/useLeaderboard.js';
import { useLockState } from '../../hooks/useLockState.js';
import { useNews } from '../../hooks/useNews.js';
import { usePredictions } from '../../hooks/usePredictions.js';
import { useAuth } from '../../hooks/useAuth.js';
import { aggregateMatchPointsBreakdown } from '../../utils/matchPointsBreakdown.js';
import { buildPerMatchPoints } from '../../utils/matchPointsPerGame.js';
import {
  finishedMatchResultsSignature,
  latestFinishedMatchId,
  rankForUser,
  resolveRankMovements,
  sortLeaderboardEntries,
} from '../../utils/leaderboardMovement.js';
import { selectHeroMatch, HERO_VARIANT } from '../../utils/selectHeroMatch.js';
import { selectTodayMatches } from '../../utils/selectTodayMatches.js';
import { scoreGroupMatch } from '../../utils/scoring.js';
import { formatRankMovementPhrase } from '../../utils/teletextDisplay.js';
import { useTeams } from '../../hooks/useTeams.js';
import { abbreviateNewsSource } from '../../utils/newsSourceAbbrev.js';
import {
  LEADERBOARD_PAGE,
  TELETEXT_LIVE_SCORES_PAGE,
  TELETEXT_TIPS_MATCH_START,
} from '../../teletext/constants.js';
import TeletextPageLink, { TeletextSeparator } from '../../components/teletext/TeletextPageLink.jsx';

function heroHeadline(hero, getTeamById) {
  if (!hero?.match) return 'Ingen match att visa';
  const home = getTeamById(hero.match.homeTeamId);
  const away = getTeamById(hero.match.awayTeamId);
  const label = `${home?.name ?? '?'} - ${away?.name ?? '?'}`;
  if (hero.variant === HERO_VARIANT.LIVE) return `Live: ${label}`;
  if (hero.variant === HERO_VARIANT.RECENT_FINISHED) return `Senast: ${label}`;
  return `Nästa höjdpunkt: ${label}`;
}

export default function TeletextDashboardPage() {
  const { user } = useAuth();
  const { entries } = useLeaderboard();
  const { matches } = useAllMatches();
  const { predictions } = usePredictions();
  const { tournamentLocked } = useLockState();
  const { articles, loading: newsLoading } = useNews(10);
  const { getTeamById } = useTeams();
  const now = Date.now();

  const myEntry = useMemo(
    () => entries.find((entry) => entry.userId === user?.id),
    [entries, user?.id],
  );
  const myRank = useMemo(() => rankForUser(entries, user?.id), [entries, user?.id]);
  const breakdown = useMemo(
    () => aggregateMatchPointsBreakdown(matches, predictions),
    [matches, predictions],
  );
  const perMatch = useMemo(
    () => buildPerMatchPoints(matches, predictions),
    [matches, predictions],
  );
  const perfectCount = perMatch.filter((item) => item.perfect).length;
  const avgScore =
    breakdown.finishedCount > 0
      ? (breakdown.earnedTotal / breakdown.finishedCount).toFixed(1)
      : '0.0';
  const hero = useMemo(() => selectHeroMatch(matches, now), [matches, now]);
  const todayCount = selectTodayMatches(matches, now).length;
  const totalPoints = myEntry?.points ?? breakdown.earnedTotal ?? 0;
  const participantCount = entries.length;

  const sortedEntries = useMemo(() => sortLeaderboardEntries(entries), [entries]);
  const latestMatchId = useMemo(() => latestFinishedMatchId(matches), [matches]);
  const resultsSignature = useMemo(
    () => finishedMatchResultsSignature(matches),
    [matches],
  );
  const myMovement = useMemo(() => {
    const movements = resolveRankMovements(sortedEntries, latestMatchId, resultsSignature);
    return user?.id ? movements[user.id] : undefined;
  }, [sortedEntries, latestMatchId, resultsSignature, user?.id]);
  const latestMatchPoints = useMemo(() => {
    if (!latestMatchId) return null;
    const match = matches.find((m) => m.id === latestMatchId);
    if (!match?.result) return null;
    return scoreGroupMatch(predictions?.matches?.[latestMatchId], match.result).points;
  }, [latestMatchId, matches, predictions]);

  return (
    <>
      <section className="teletext-article">
        <p className="teletext-row teletext-row--bold teletext-row--yellow teletext-row--center">
          Du har {totalPoints} poäng efter {breakdown.finishedCount} VM-matcher
        </p>
        <p className="teletext-row teletext-row--yellow teletext-row--center">
          Ligger på postion {myRank ?? '–'} av {participantCount || '–'} deltagare
        </p>
        <TeletextSeparator page={LEADERBOARD_PAGE}>
          {LEADERBOARD_PAGE != null ? LEADERBOARD_PAGE : '---'}
        </TeletextSeparator>
      </section>

      <p className="teletext-row teletext-row--cyan teletext-row--center teletext-row--wrap teletext-article">
        Du har i snitt tagit {avgScore} poäng per match med {perfectCount} st fullpoängare
      </p>

      {latestMatchId != null && latestMatchPoints != null ? (
        <section className="teletext-article">
          <p className="teletext-row teletext-row--white teletext-row--center">
            Senaste matchen gav dig {latestMatchPoints} poäng
          </p>
          <p className="teletext-row teletext-row--white teletext-row--center">
            {formatRankMovementPhrase(myMovement)}
          </p>
        </section>
      ) : null}

      <section className="teletext-article teletext-row--center">
        <p className="teletext-row teletext-row--cyan teletext-row--wrap">
          {tournamentLocked
            ? 'Tippningen har nu stängt men du kan fortfarande kolla dina gamla tips'
            : 'Se och uppdatera dina tips i teletext'}
        </p>
        <p className="teletext-row teletext-row--cyan teletext-row--center">
          <TeletextPageLink page={TELETEXT_TIPS_MATCH_START}>
            {TELETEXT_TIPS_MATCH_START}
          </TeletextPageLink>
        </p>
      </section>

      <section className="teletext-article">
        <p className="teletext-row teletext-row--bold teletext-row--yellow teletext-row--center">
          {heroHeadline(hero, getTeamById)}
        </p>
        <p className="teletext-row teletext-row--yellow teletext-row--center">
          {todayCount > 0
            ? `${todayCount} matcher i VM idag, hur kommer det gå`
            : 'Inga matcher schemalagda idag'}
        </p>
        <TeletextSeparator page={TELETEXT_LIVE_SCORES_PAGE}>
          {TELETEXT_LIVE_SCORES_PAGE}
        </TeletextSeparator>
      </section>

      <section className="teletext-news-list">
        <p className="teletext-row teletext-row--yellow">Övriga nyheter</p>
        {newsLoading && articles.length === 0 ? (
          <p className="teletext-row">Hämtar nyheter…</p>
        ) : null}
        {!newsLoading && articles.length === 0 ? (
          <p className="teletext-row">Inga nyheter ännu.</p>
        ) : null}
        {articles.map((article) => (
          <div key={article.id} className="teletext-news-row">
            <span className="teletext-news-headline">{article.title}</span>
            <TeletextPageLink
              external
              href={article.url}
              className="teletext-link--external"
            >
              {abbreviateNewsSource(article.source)}
            </TeletextPageLink>
          </div>
        ))}
      </section>
    </>
  );
}
