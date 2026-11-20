import { SNOW_CODES } from './constants';
import { WeatherData } from './fetch-weather';

const HOUR = 60 * 60 * 1000;

export interface HourPoint {
  /** Start of the hour, in ms */
  time: number;
  temperature: number;
  /** 0-100 */
  precipProbability: number;
  /** mm in this hour */
  precipitation: number;
  weatherCode: number;
}

/** Hours before the current hour that the graph starts at */
const HOURS_BEFORE = 2;
const WINDOW_LENGTH = 25;

/** The hourly forecast from two hours ago until about a day ahead. Hours without data are skipped. */
export function getHourlyWindow(data: WeatherData, now: number): HourPoint[] {
  const currentHour = new Date(now);
  currentHour.setMinutes(0, 0, 0);
  const start = currentHour.getTime() - HOURS_BEFORE * HOUR;

  const { time, temperature_2m, precipitation_probability, precipitation, weather_code } =
    data.hourly;
  const indexByTime = new Map(time.map((date, index) => [date.getTime(), index]));

  const points: HourPoint[] = [];
  for (let i = 0; i < WINDOW_LENGTH; i++) {
    const t = start + i * HOUR;
    const index = indexByTime.get(t);
    if (index === undefined) continue;
    points.push({
      time: t,
      temperature: temperature_2m[index],
      precipProbability: precipitation_probability[index],
      precipitation: precipitation[index],
      weatherCode: weather_code[index],
    });
  }
  return points;
}

export interface DaySummary {
  max: number;
  min: number;
  precipProbability: number;
  precipitation: number;
}

/** Summary of the calendar day that contains the given moment, or null if there is no data for it */
export function getDaySummary(data: WeatherData, at: number): DaySummary | null {
  const { time, temperature_2m_max, temperature_2m_min } = data.daily;
  const index = time.findIndex((date) => at >= date.getTime() && at < date.getTime() + 24 * HOUR);
  if (index === -1) return null;

  return {
    max: temperature_2m_max[index],
    min: temperature_2m_min[index],
    precipProbability: data.daily.precipitation_probability_max[index],
    precipitation: data.daily.precipitation_sum[index],
  };
}

/** Whether an hour counts as wet: ignores the many tiny probabilities that come with no actual rain */
export function isWetHour(point: HourPoint) {
  return (
    (point.precipProbability >= 40 && point.precipitation >= 0.1) || point.precipitation >= 0.5
  );
}

/** Chance of rain (%) from which "dry" would be misleading even when no rain is expected */
const LIKELY_CHANCE = 60;

const isSnow = (point: HourPoint) => SNOW_CODES.has(point.weatherCode);

function formatHour(time: number) {
  return `${String(new Date(time).getHours()).padStart(2, '0')}:00`;
}

/** One-line summary of when it is going to rain or stay dry, or null if the data doesn't cover now */
export function describeRain(points: HourPoint[], now: number): string | null {
  const current = points.findIndex((point) => point.time <= now && now < point.time + HOUR);
  const upcoming = points.slice(current + 1);
  if (current === -1 || upcoming.length === 0) return null;

  if (isWetHour(points[current])) {
    const kind = isSnow(points[current]) ? 'Sneeuw' : 'Regen';
    const dry = upcoming.find((point) => !isWetHour(point));
    return dry
      ? `${kind} tot ${formatHour(dry.time)}, daarna droog`
      : `${kind} de komende uren, ook later nog`;
  }

  const wet = upcoming.find(isWetHour);
  if (wet) return `Droog tot ${formatHour(wet.time)}, daarna ${isSnow(wet) ? 'sneeuw' : 'regen'}`;

  // No rain expected, but the forecast can still give a high chance with an expected amount of 0 mm
  const likely = upcoming.filter((point) => point.precipProbability >= LIKELY_CHANCE);
  if (likely.length > 0) {
    const peak = likely.reduce((a, b) => (b.precipProbability > a.precipProbability ? b : a));
    return `Droog, maar kans op ${isSnow(peak) ? 'sneeuw' : 'regen'} rond ${formatHour(peak.time)}`;
  }
  return `Droog de komende ${upcoming.length} uur`;
}

export const formatTemperature = (value: number) => `${Math.round(value)}°`;

/** Whole mm from 1 mm up, one decimal below that, so a light shower doesn't show as 0 */
export function formatPrecipitation(mm: number) {
  if (mm >= 1) return `${Math.round(mm)} mm`;
  if (mm > 0) return `${(Math.round(mm * 10) / 10).toString()} mm`;
  return '0 mm';
}
