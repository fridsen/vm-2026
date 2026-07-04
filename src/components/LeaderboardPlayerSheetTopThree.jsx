import clsx from 'clsx';
import { flagImageForCode } from '../data/flagImages.js';
import { useTeams } from '../hooks/useTeams.js';
import LeaderboardPlayerSheetPointsBadge from './LeaderboardPlayerSheetPointsBadge.jsx';
import {
  actualTopThreeTeamIds,
  isPodiumFinalized,
  knockoutMatchesFromList,
  topThreeRankPointsAtIndex,
  topThreeSheetTotalPoints,
} from '../utils/topThreeStandingSheet.js';
import { normalizeTopThree } from '../utils/topThree.js';

const RANK_BADGE_CLASS = ['rank-gold', 'rank-silver', 'rank-bronze'];

export default function LeaderboardPlayerSheetTopThree({
  matches,
  topThree,
  loading,
  showPoints = true,
}) {
  const { getTeamById } = useTeams();
  const knockoutMatches = knockoutMatchesFromList(matches);
  const finalized = isPodiumFinalized(knockoutMatches);
  const actual = actualTopThreeTeamIds(knockoutMatches);
  const pred = normalizeTopThree(topThree);
  const totalPoints = topThreeSheetTotalPoints(pred, actual, finalized);
  const hasData = pred.some(Boolean);

  if (loading && !hasData) {
    return <p className="lb-sheet-empty">Laddar…</p>;
  }

  if (!hasData) {
    return <p className="lb-sheet-empty">Ingen tippning att visa</p>;
  }

  return (
    <section className="lb-sheet-group">
      <header className="lb-sheet-group-header">
        <h3>VINNARE</h3>
      </header>
      <div className="lb-sheet-group-columns" aria-hidden>
        <span>Tippning</span>
        {showPoints ? <span>Poäng</span> : null}
      </div>
      {pred.map((teamId, rankIndex) => {
        if (!teamId) return null;
        const team = getTeamById(teamId);
        if (!team) return null;
        const points = topThreeRankPointsAtIndex(rankIndex, pred, actual, finalized);
        const flagImage = flagImageForCode(team.code || team.id);

        return (
          <div key={teamId} className="lb-sheet-group-row">
            <div className="lb-sheet-group-team">
              <span className={clsx('mina-rank-badge', RANK_BADGE_CLASS[rankIndex])}>
                {rankIndex + 1}
              </span>
              <span className="mina-rank-flag" aria-hidden>
                {flagImage ? <img src={flagImage} alt="" /> : team.flag}
              </span>
              <span className="lb-sheet-group-code">{team.code || team.id}</span>
            </div>
            {showPoints && points != null ? (
              <LeaderboardPlayerSheetPointsBadge
                points={points}
                variant="row"
                finalized={finalized}
              />
            ) : null}
          </div>
        );
      })}
      {showPoints ? (
        <footer className="lb-sheet-group-footer">
          <span>Totalpoäng</span>
          <LeaderboardPlayerSheetPointsBadge
            points={totalPoints}
            variant="total"
            finalized={finalized}
          />
        </footer>
      ) : null}
    </section>
  );
}
