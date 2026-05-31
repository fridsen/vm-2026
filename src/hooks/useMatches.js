import { useEffect, useState } from 'react';
import {
  fetchAllMatches,
  fetchMatchesByGroup,
  fetchKnockoutMatches,
} from '../services/matchesService.js';

export function useAllMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchAllMatches().then((data) => {
      if (!mounted) return;
      setMatches(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { matches, loading };
}

export function useGroupMatches(group) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchMatchesByGroup(group).then((data) => {
      if (!mounted) return;
      setMatches(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [group]);

  return { matches, loading };
}

export function useKnockoutMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchKnockoutMatches().then((data) => {
      if (!mounted) return;
      setMatches(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { matches, loading };
}
