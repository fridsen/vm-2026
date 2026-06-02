import { useCallback, useEffect, useMemo, useState } from 'react';
import { TeamsContext } from '../hooks/useTeams.js';
import { fetchTeams, teamIdsInGroup } from '../services/teamsService.js';

export default function TeamsProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await fetchTeams();
        if (mounted) setTeams(rows);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  const getTeamById = useCallback((id) => teamMap.get(id), [teamMap]);

  const getTeamsInGroup = useCallback(
    (group, matches) =>
      teamIdsInGroup(group, matches)
        .map((id) => teamMap.get(id))
        .filter(Boolean),
    [teamMap],
  );

  const value = useMemo(
    () => ({
      teams,
      loading,
      error,
      getTeamById,
      getTeamsInGroup,
    }),
    [teams, loading, error, getTeamById, getTeamsInGroup],
  );

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
}
