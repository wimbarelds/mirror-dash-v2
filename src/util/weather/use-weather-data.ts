import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useDataSources } from '../../data-sources';

const REFRESH_INTERVAL = 15 * 60 * 1000;

export function useWeatherData() {
  const { key, live, fetchWeather } = useDataSources();

  return useQuery({
    queryKey: ['weather', key],
    queryFn: fetchWeather,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
    // Never throw errors into React: the app has no error boundary around the data components, so a
    // single failed refresh used to unmount the whole page and leave a black screen. Instead, keep
    // showing the last good data and let the next interval try again.
    retry: live ? 3 : false,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 60_000),
    // A replay switches to a new key for every moment: keep showing the previous one meanwhile
    placeholderData: keepPreviousData,
  });
}
