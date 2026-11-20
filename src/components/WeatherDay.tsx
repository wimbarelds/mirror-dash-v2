import { useNow } from '../util/use-now';
import { formatPrecipitation, formatTemperature, getDaySummary } from '../util/weather/selectors';
import { useWeatherData } from '../util/weather/use-weather-data';

const DAY = 24 * 60 * 60 * 1000;

function getDayText(offset: number) {
  if (!offset) return 'Vandaag';
  if (offset === 1) return 'Morgen';
  return `Over ${offset} dagen`;
}

interface Props {
  dayOffset?: number;
}

export function WeatherDay({ dayOffset = 0 }: Props) {
  const { data } = useWeatherData();
  const now = useNow().getTime();
  const summary = data ? getDaySummary(data, now + dayOffset * DAY) : null;

  return (
    <section className="min-w-40">
      <h3 className="text-[1.625rem] text-white/60">{getDayText(dayOffset)}</h3>
      {summary ? (
        <>
          <p className="text-[1.875rem]">
            {formatTemperature(summary.max)}{' '}
            <span className="text-white/60">/ {formatTemperature(summary.min)}</span>
          </p>
          <p className="text-[1.625rem] text-rain">
            {Math.round(summary.precipProbability)}% · {formatPrecipitation(summary.precipitation)}
          </p>
        </>
      ) : (
        <p className="text-[1.875rem] text-white/40">–</p>
      )}
    </section>
  );
}
