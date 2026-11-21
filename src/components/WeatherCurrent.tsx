import clsx from 'clsx';
import { useMemo } from 'react';

import { formatTime } from '../util/time';
import { useNow } from '../util/use-now';
import {
  describeIce,
  describeRain,
  formatTemperature,
  getHourlyWindow,
} from '../util/weather/selectors';
import { useWeatherData } from '../util/weather/use-weather-data';
import { getWeatherCodeInfo } from '../util/weather/weather-code-utils';
import { IceIcon, WeatherIcon } from './WeatherIcon';

/** Data older than this is shown as such */
const STALE_AFTER = 45 * 60 * 1000;

export function WeatherCurrent() {
  const { data, isError, dataUpdatedAt } = useWeatherData();
  const now = useNow().getTime();
  const { sentence, ice } = useMemo(() => {
    if (!data) return { sentence: null, ice: null };
    const points = getHourlyWindow(data, now);
    return { sentence: describeRain(points, now), ice: describeIce(points, now) };
  }, [data, now]);

  if (!data) {
    return isError ? (
      <p className="text-[1.75rem] text-white/50">Weerdata niet beschikbaar</p>
    ) : null;
  }

  const { temperature_2m, apparent_temperature, weather_code = 0, is_day = 1 } = data.current;
  const info = getWeatherCodeInfo(weather_code, !is_day);
  const isStale = now - dataUpdatedAt > STALE_AFTER;

  return (
    <div>
      <div className="flex items-center gap-6">
        <WeatherIcon kind={info.icon} className="w-[8.125rem] shrink-0" />
        <div className="text-[8.75rem] leading-none font-extralight">
          {temperature_2m === undefined ? '–' : formatTemperature(temperature_2m)}
        </div>
        <div className="text-[2.125rem] leading-tight text-white/60">
          {info.description}
          {apparent_temperature !== undefined && (
            <>
              <br />
              voelt als {formatTemperature(apparent_temperature)}
            </>
          )}
        </div>
      </div>
      {sentence && <p className="mt-[1.625rem] text-[2rem] text-rain">{sentence}</p>}
      {ice && (
        <p
          className={clsx(
            'mt-4 inline-flex items-center gap-3 rounded-xl border-[3px] border-ice px-5 py-2 text-[2.25rem] font-medium',
            ice.level === 'likely' ? 'bg-ice text-black' : 'text-ice',
          )}
        >
          <IceIcon className="size-9" />
          {ice.text}
        </p>
      )}
      {isStale && (
        <p className="mt-2 text-[1.375rem] text-white/40">
          Weerdata van {formatTime(dataUpdatedAt)}
        </p>
      )}
    </div>
  );
}
