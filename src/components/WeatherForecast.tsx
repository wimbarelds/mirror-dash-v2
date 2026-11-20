import { useMemo } from 'react';

import { useNow } from '../util/use-now';
import { getHourlyWindow } from '../util/weather/selectors';
import { useWeatherData } from '../util/weather/use-weather-data';
import { WeatherGraph } from './WeatherGraph/WeatherGraph';

export function WeatherForecast() {
  const { data } = useWeatherData();
  const now = useNow().getTime();
  const points = useMemo(() => (data ? getHourlyWindow(data, now) : []), [data, now]);

  return <WeatherGraph points={points} now={now} />;
}
