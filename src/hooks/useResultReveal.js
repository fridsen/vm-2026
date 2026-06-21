import { useContext } from 'react';
import { ResultRevealContext } from '../components/resultReveal/ResultRevealContext.js';

export function useResultReveal() {
  const ctx = useContext(ResultRevealContext);
  if (!ctx) {
    throw new Error('useResultReveal must be used inside <ResultRevealProvider>');
  }
  return ctx;
}
