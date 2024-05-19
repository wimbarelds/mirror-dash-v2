import { useQuery } from '@tanstack/react-query';
import { fetchWeatherData } from './fetch-weather';

export function useWeatherData() {
  return useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeatherData,
    refetchInterval: 15 * 60 * 1000,
    throwOnError: true,
    retry: 0,
  });
}
