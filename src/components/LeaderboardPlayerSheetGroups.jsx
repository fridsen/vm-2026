import clsx from 'clsx';
import { flagImageForCode } from '../data/flagImages.js';
import { GROUPS } from '../data/teams.js';
import { useTeams } from '../hooks/useTeams.js';
import { formatMatchPointsLabel } from '../utils/matchPointsBadge.js';
import {
  groupRowPointsBadgeColors,
  groupTotalPointsBadgeColors,
} from '../utils/groupPointsBadge.js';
import {
  actualGroupTeamIds,
  groupRankPointsAtIndex,
  groupSheetTotalPoints,
  isGroupFinalized,
  orderedGroupPrediction,
} from '../utils/groupStandingSheet.js';

const RANK_BADGE_CLASS = ['rank-gold', 'rank-silver', 'rank-bronze', 'rank-fourth'];

function SheetPointsBadge({ points, variant = 'row', finalized }) {
  const value = Math.max(0, Math.round(Number(points) || 0));
  const colors =
    variant === 'total'
      ? groupTotalPointsBadgeColors(value, finalized)
      : groupRowPointsBadgeColors(value, finalized);

  return (
    <span
      className={clsx('lb-sheet-points-badge', variant === 'total' && 'is-total')}
      style={{ '--mpb-bg': colors.bg, '--mpb-text': colors.text }}
    >
      {formatMatchPointsLabel(value)}
    </span>
  );
}

function GroupSection({ group, matches, groupStandings, showPoints }) {
  const { getTeamsInGroup, getTeamById } = useTeams();
  const allTeams = getTeamsInGroup(group, matches);
  const allTeamIds = allTeams.map((t) => t.id);
  const ranked = groupStandings?.[group] ?? [];
  const orderedIds = orderedGroupPrediction(ranked, allTeamIds);
  const groupMatches = matches.filter((m) => m.group === group);
  const finalized = isGroupFinalized(group, matches);
  const actual = actualGroupTeamIds(groupMatches, allTeams);
  const pred = orderedIds.length >= 4 ? orderedIds.slice(0, 4) : orderedIds;
  const totalPoints = groupSheetTotalPoints(pred, actual, finalized);

  return (
    <section className="lb-sheet-group">
      <header className="lb-sheet-group-header">
        <h3>GRUPP {group}</h3>
        <span>Alla rätt ger +3 poäng</span>
      </header>
      <div className="lb-sheet-group-columns" aria-hidden>
        <span>Tippning</span>
        {showPoints ? <span>Poäng</span> : null}
      </div>
      {orderedIds.map((teamId, rankIndex) => {
        const team = getTeamById(teamId) ?? allTeams.find((t) => t.id === teamId);
        if (!team) return null;
        const points = groupRankPointsAtIndex(rankIndex, pred, actual, finalized);
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
              <SheetPointsBadge points={points} variant="row" finalized={finalized} />
            ) : null}
          </div>
        );
      })}
      {showPoints ? (
        <footer className="lb-sheet-group-footer">
          <span>Totalpoäng</span>
          <SheetPointsBadge points={totalPoints} variant="total" finalized={finalized} />
        </footer>
      ) : null}
    </section>
  );
}

export default function LeaderboardPlayerSheetGroups({
  matches,
  groupStandings,
  loading,
  showPoints = false,
}) {
  const hasData = Object.keys(groupStandings).length > 0;

  if (loading && !hasData) {
    return <p className="lb-sheet-empty">Laddar…</p>;
  }

  return GROUPS.map((group) => (
    <GroupSection
      key={group}
      group={group}
      matches={matches}
      groupStandings={groupStandings}
      showPoints={showPoints}
    />
  ));
}
