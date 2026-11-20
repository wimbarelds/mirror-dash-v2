import { useQuery } from '@tanstack/react-query';

import { fetchWeatherData } from './fetch-weather';

const REFRESH_INTERVAL = 15 * 60 * 1000;

export function useWeatherData() {
  return useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeatherData,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
    // Never throw errors into React: the app has no error boundary around the data components, so a
    // single failed refresh used to unmount the whole page and leave a black screen. Instead, keep
    // showing the last good data and let the next interval try again.
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 60_000),
  });
}
