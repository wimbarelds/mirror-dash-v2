import { useEffect, useReducer } from 'react';

import { useDataSources } from '../data-sources';

/**
 * The current time, refreshed at the start of every minute. In a replay it follows the simulated
 * time instead, and re-renders when that changes.
 */
export function useNow() {
  const { now, live } = useDataSources();
  const [ticks, tick] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    if (!live) return;
    const msUntilNextMinute = 60_000 - (now() % 60_000);
    const timeout = setTimeout(tick, msUntilNextMinute + 50);
    return () => clearTimeout(timeout);
  }, [live, now, ticks]);

  return new Date(now());
}
