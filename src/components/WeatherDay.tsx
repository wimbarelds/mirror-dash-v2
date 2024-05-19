import { useWeatherData } from '../util/weather/use-weather-data';
import { getWeatherCodeInfo } from '../util/weather/weather-code-utils';

function getToday() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date;
}

function getDayOffsetDate(offset: number) {
  const date = getToday();
  date.setDate(date.getDate() + offset);
  return date;
}

function sameDay(d1: Date, d2: Date) {
  if (d1.getFullYear() !== d2.getFullYear()) return false;
  if (d1.getMonth() !== d2.getMonth()) return false;
  if (d1.getDate() !== d2.getDate()) return false;
  return true;
}

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
  const date = getDayOffsetDate(dayOffset);

  if (!data) return 'No data!';
  const dayIndex = data.daily.time.findIndex((item) => sameDay(date, item));
  type Key = keyof typeof data.daily;
  const keys = Object.keys(data.daily) as Key[];
  const {
    precipitation_probability_max,
    precipitation_sum,
    temperature_2m_min,
    temperature_2m_max,
    weather_code,
  } = keys.reduce(
    (obj, key) => ({ ...obj, [key]: data.daily[key][dayIndex] }),
    {},
  ) as Record<Key, number>;
  const { description, image } = getWeatherCodeInfo(weather_code);

  return (
    <section className="px-4 flex flex-col items-center w-[150px]">
      <h3 className="text-2xl text-center">{getDayText(dayOffset)}</h3>
      <div className="flex items-center">
        <img src={image} alt="" className="w-[50px]" />
        <p className="flex-1">{description}</p>
      </div>
      <div className="flex flex-col">
        <div className="flex gap-3">
          <span>🌡</span>
          <p>{Math.round(temperature_2m_max * 10) / 10}&deg;</p>
          <p>{Math.round(temperature_2m_min * 10) / 10}&deg;</p>
        </div>
        <div className="flex gap-3">
          <span>💧</span>
          <p>{Math.round(precipitation_probability_max * 10) / 10}%</p>
          <p>
            {Math.round(precipitation_sum)}
            <span className="pl-0.5 text-[.6rem]">mm</span>
          </p>
        </div>
      </div>
    </section>
  );
}
