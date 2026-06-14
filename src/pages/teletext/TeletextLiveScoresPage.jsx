import { useMemo } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { GROUPS } from '../../data/teams.js';
import { useAllMatches } from '../../hooks/useMatches.js';
import { useTeams } from '../../hooks/useTeams.js';
import { getMatchDayKey, getMatchState, MATCH_STATE } from '../../utils/matchSchedule.js';
import {
  formatMalserviceFinishedScore,
  formatMalserviceKickoff,
  formatTeletextScore,
  getMalserviceRowVariant,
  MALSERVICE_ROW,
  sortMalserviceMatches,
} from '../../utils/teletextDisplay.js';

function groupMatchesForMalservice(matches, now) {
  const todayKey = format(new Date(now), 'yyyy-MM-dd');
  const relevant = (matches ?? []).filter((match) => {
    const state = getMatchState(match, now);
    return getMatchDayKey(match.kickoff) === todayKey || state === MATCH_STATE.LIVE;
  });

  const byGroup = new Map();
  for (const group of GROUPS) {
    const groupMatches = sortMalserviceMatches(
      relevant.filter((match) => match.group === group),
      now,
    );
    if (groupMatches.length > 0) {
      byGroup.set(group, groupMatches);
    }
  }
  return byGroup;
}

export default function TeletextLiveScoresPage() {
  const { matches } = useAllMatches();
  const { getTeamById } = useTeams();
  const now = Date.now();

  const groupedMatches = useMemo(
    () => groupMatchesForMalservice(matches, now),
    [matches, now],
  );

  if (groupedMatches.size === 0) {
    return (
      <p className="teletext-row teletext-row--cyan teletext-row--center">
        Inga matcher idag
      </p>
    );
  }

  return (
    <div className="teletext-malservice-page">
      {[...groupedMatches.entries()].map(([group, groupMatches]) => (
        <section key={group} className="teletext-malservice-group">
          <p className="teletext-row teletext-row--green teletext-malservice-heading">
            Fotboll VM grupp {group}
          </p>
          {groupMatches.map((match) => {
            const variant = getMalserviceRowVariant(match, now);
            const homeTeam = getTeamById(match.homeTeamId);
            const awayTeam = getTeamById(match.awayTeamId);
            const kickoffTime = formatMalserviceKickoff(match.kickoff);

            return (
              <div
                key={match.id}
                className={clsx('teletext-malservice-grid', `is-${variant}`)}
              >
                <span className="teletext-row teletext-malservice-home">
                  {homeTeam?.name ?? match.homeTeamId}
                </span>
                <span className="teletext-row teletext-malservice-away">
                  - {awayTeam?.name ?? match.awayTeamId}
                </span>

                {variant === MALSERVICE_ROW.FINISHED ? (
                  <span className="teletext-row teletext-malservice-score teletext-malservice-score--finished">
                    {formatMalserviceFinishedScore(match)}
                  </span>
                ) : null}

                {variant === MALSERVICE_ROW.LIVE ? (
                  <>
                    <span className="teletext-row teletext-malservice-score teletext-malservice-score--live">
                      {formatTeletextScore(match)}
                    </span>
                    <span className="teletext-row teletext-malservice-time">
                      {kickoffTime}
                    </span>
                  </>
                ) : null}

                {variant === MALSERVICE_ROW.UPCOMING ? (
                  <>
                    <span className="teletext-row teletext-malservice-score teletext-malservice-score--upcoming">
                      X-X
                    </span>
                    <span className="teletext-row teletext-malservice-time">
                      {kickoffTime}
                    </span>
                  </>
                ) : null}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
