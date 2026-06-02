import { createContext, useContext } from 'react';

export const TeamsContext = createContext(null);

export function useTeams() {
  const ctx = useContext(TeamsContext);
  if (!ctx) {
    throw new Error('useTeams must be used inside <TeamsProvider>');
  }
  return ctx;
}
