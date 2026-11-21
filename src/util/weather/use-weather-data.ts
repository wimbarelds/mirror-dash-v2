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
    // Never throw into React (that blanks the page): keep the last good data, retry on the interval
    retry: live ? 3 : false,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 60_000),
    // Mock data changes the key for every moment; keep showing the last one meanwhile
    placeholderData: keepPreviousData,
  });
}
