import { PRECIPITATION_CODES, SNOW_CODES } from './constants';
import { WeatherData } from './fetch-weather';
import { getIceRisk, IceRisk } from './ice';

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
  /** Risk of slippery roads */
  ice: IceRisk;
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
      ice: getIceRisk(data.hourly, index),
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

/**
 * Whether an hour counts as wet. Some rain has to be expected: a high chance on its own, with 0 mm,
 * doesn't count. The weather code is accepted as confirmation, since its probability can dip
 * in the middle of a spell of snow or rain.
 */
export function isWetHour(point: HourPoint) {
  if (point.precipitation >= 0.5) return true;

  const likely = point.precipProbability >= 40;
  const some = point.precipitation >= 0.1;
  const confirmed = PRECIPITATION_CODES.has(point.weatherCode);
  return (some && likely) || (confirmed && (some || likely));
}

/** Chance of rain (%) from which "dry" would be misleading even when no rain is expected */
const LIKELY_CHANCE = 60;

export const isSnow = (point: HourPoint) => SNOW_CODES.has(point.weatherCode);

function formatHour(time: number) {
  return `${String(new Date(time).getHours()).padStart(2, '0')}:00`;
}

const kindOf = (point: HourPoint) => (isSnow(point) ? 'sneeuw' : 'regen');

/**
 * The hour with the highest chance of rain, if it's high enough to matter. The forecast can give a
 * high chance with an expected amount of 0 mm, which "dry" would be misleading about.
 */
function findLikelyChance(points: HourPoint[]) {
  const likely = points.filter((point) => point.precipProbability >= LIKELY_CHANCE);
  if (likely.length === 0) return undefined;
  return likely.reduce((a, b) => (b.precipProbability > a.precipProbability ? b : a));
}

/** One-line summary of when it is going to rain or stay dry, or null if the data doesn't cover now */
export function describeRain(points: HourPoint[], now: number): string | null {
  const current = points.findIndex((point) => point.time <= now && now < point.time + HOUR);
  const upcoming = points.slice(current + 1);
  if (current === -1 || upcoming.length === 0) return null;

  if (isWetHour(points[current])) {
    const kind = isSnow(points[current]) ? 'Sneeuw' : 'Regen';
    // A single dry hour in between doesn't end it; it has to stay dry for two hours
    const dry = upcoming.find((point, i) => {
      const next = upcoming[i + 1];
      return !isWetHour(point) && !(next && isWetHour(next));
    });
    if (!dry) return `${kind} de komende uren, ook later nog`;

    const after = upcoming.slice(upcoming.indexOf(dry));
    const again = after.find(isWetHour);
    if (again)
      return `${kind} tot ${formatHour(dry.time)}, vanaf ${formatHour(again.time)} weer ${kindOf(again)}`;
    const chance = findLikelyChance(after);
    if (chance) {
      return `${kind} tot ${formatHour(dry.time)}, rond ${formatHour(chance.time)} weer kans op ${kindOf(chance)}`;
    }
    return `${kind} tot ${formatHour(dry.time)}, daarna droog`;
  }

  const wet = upcoming.find(isWetHour);
  if (wet) return `Droog tot ${formatHour(wet.time)}, daarna ${kindOf(wet)}`;

  const chance = findLikelyChance(upcoming);
  if (chance) return `Droog, maar kans op ${kindOf(chance)} rond ${formatHour(chance.time)}`;
  return `Droog de komende ${upcoming.length} uur`;
}

export interface IceWarning {
  /** "likely" is frozen or freezing roads; "possible" is close to it */
  level: Exclude<IceRisk, 'none'>;
  text: string;
}

/** Only mention slippery roads that start within this many hours; further out is too uncertain */
const ICE_LOOKAHEAD_HOURS = 12;

/** A warning for slippery roads now or soon, or null when there is none to give */
export function describeIce(points: HourPoint[], now: number): IceWarning | null {
  const current = points.findIndex((point) => point.time <= now && now < point.time + HOUR);
  if (current === -1) return null;

  const horizon = now + ICE_LOOKAHEAD_HOURS * HOUR;
  const start = points.findIndex(
    (point, index) => index >= current && point.time < horizon && point.ice !== 'none',
  );
  if (start === -1) return null;

  let end = start;
  while (end + 1 < points.length && points[end + 1].ice !== 'none') end++;

  const level = points.slice(start, end + 1).some((point) => point.ice === 'likely')
    ? 'likely'
    : 'possible';
  const label = level === 'likely' ? 'Gladheid' : 'Kans op gladheid';
  const clearAgain = points[end + 1];

  if (start > current) return { level, text: `${label} vanaf ${formatHour(points[start].time)}` };
  if (!clearAgain) return { level, text: `${label} de komende uren` };
  return { level, text: `${label} tot ${formatHour(clearAgain.time)}` };
}

export const formatTemperature = (value: number) => `${Math.round(value)}°`;

/** Whole mm from 1 mm up, one decimal below that, so a light shower doesn't show as 0 */
export function formatPrecipitation(mm: number) {
  if (mm >= 1) return `${Math.round(mm)} mm`;
  if (mm > 0) return `${(Math.round(mm * 10) / 10).toString()} mm`;
  return '0 mm';
}
