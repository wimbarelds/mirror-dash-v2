import { WeatherData } from '../util/weather/fetch-weather';
import { DAYS, hourIndexAt, history, timeAt } from './history';

type Hourly = WeatherData['hourly'];
type Daily = WeatherData['daily'];

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** The most frequent value; the highest on a tie, as that is the more severe weather */
function mostCommon(values: number[]) {
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

function buildHourly(): Hourly {
  return {
    time: Array.from({ length: history.hours }, (_, i) => timeAt(Math.floor(i / 24), i % 24)),
    temperature_2m: history.temperature_2m,
    apparent_temperature: history.apparent_temperature,
    precipitation_probability: history.precipitation_probability,
    precipitation: history.precipitation,
    weather_code: history.weather_code,
    soil_temperature_0cm: history.soil_temperature_0cm,
    relative_humidity_2m: history.relative_humidity_2m,
  };
}

/** Daily figures derived from the hours */
function buildDaily(): Daily {
  const daily: Daily = {
    time: [],
    weather_code: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
    apparent_temperature_max: [],
    apparent_temperature_min: [],
    precipitation_sum: [],
    precipitation_probability_max: [],
  };

  for (let day = 0; day < DAYS; day++) {
    const from = day * 24;
    const to = from + 24;
    const temperature = history.temperature_2m.slice(from, to);
    const apparent = history.apparent_temperature.slice(from, to);

    daily.time.push(timeAt(day));
    daily.weather_code.push(mostCommon(history.weather_code.slice(from + 6, to - 2)));
    daily.temperature_2m_max.push(Math.max(...temperature));
    daily.temperature_2m_min.push(Math.min(...temperature));
    daily.apparent_temperature_max.push(Math.max(...apparent));
    daily.apparent_temperature_min.push(Math.min(...apparent));
    daily.precipitation_sum.push(sum(history.precipitation.slice(from, to)));
    daily.precipitation_probability_max.push(
      Math.max(...history.precipitation_probability.slice(from, to)),
    );
  }
  return daily;
}

let shared: { hourly: Hourly; daily: Daily } | undefined;

/** What fetchWeatherData would have returned at the given moment */
export function buildWeatherData(at: number): WeatherData {
  shared ??= { hourly: buildHourly(), daily: buildDaily() };

  const index = hourIndexAt(at);
  const next = Math.min(index + 1, history.hours - 1);
  const fraction = new Date(at).getMinutes() / 60;
  const between = (values: number[]) => values[index] + (values[next] - values[index]) * fraction;

  return {
    current: {
      time: new Date(at),
      temperature_2m: between(history.temperature_2m),
      apparent_temperature: between(history.apparent_temperature),
      precipitation: history.precipitation[index],
      weather_code: history.weather_code[index],
      is_day: history.is_day[index],
    },
    ...shared,
  };
}
