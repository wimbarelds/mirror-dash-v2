import { useEffect, useState } from 'react';

/** The current time, refreshed at the start of every minute. */
export function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const msUntilNextMinute = 60_000 - (now.getTime() % 60_000);
    const timeout = setTimeout(() => setNow(new Date()), msUntilNextMinute + 50);
    return () => clearTimeout(timeout);
  }, [now]);

  return now;
}
