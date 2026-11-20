import { getIceRisk } from '../util/weather/ice';
import { DAYS, history, timeAt } from './history';

export interface Highlight {
  label: string;
  /** A moment shortly before the interesting weather starts, so it is inside the graph */
  at: number;
}

const SNOW = new Set([71, 73, 75, 77, 85, 86]);
const FOG = new Set([45, 48]);
const DRIZZLE = new Set([51, 53, 55, 56, 57]);

interface DayStats {
  day: number;
  max: number;
  maxHour: number;
  min: number;
  minHour: number;
  rain: number;
  rainiestHour: number;
  rainiestHourAmount: number;
  snowHours: number;
  firstSnow: number;
  fogHours: number;
  firstFog: number;
  clearHours: number;
  drizzleHours: number;
  firstDrizzle: number;
  rainChanges: number;
  iceHours: number;
  firstIce: number;
}

function getDayStats(day: number): DayStats {
  const stats: DayStats = {
    day,
    max: -Infinity,
    maxHour: 0,
    min: Infinity,
    minHour: 0,
    rain: 0,
    rainiestHour: 0,
    rainiestHourAmount: -1,
    snowHours: 0,
    firstSnow: 0,
    fogHours: 0,
    firstFog: 0,
    clearHours: 0,
    drizzleHours: 0,
    firstDrizzle: 0,
    rainChanges: 0,
    iceHours: 0,
    firstIce: 0,
  };

  for (let hour = 0; hour < 24; hour++) {
    const i = day * 24 + hour;
    const temperature = history.temperature_2m[i];
    const precipitation = history.precipitation[i];
    const code = history.weather_code[i];

    if (temperature > stats.max) [stats.max, stats.maxHour] = [temperature, hour];
    if (temperature < stats.min) [stats.min, stats.minHour] = [temperature, hour];
    stats.rain += precipitation;
    if (precipitation > stats.rainiestHourAmount) {
      [stats.rainiestHourAmount, stats.rainiestHour] = [precipitation, hour];
    }
    if (SNOW.has(code) && stats.snowHours++ === 0) stats.firstSnow = hour;
    if (FOG.has(code) && stats.fogHours++ === 0) stats.firstFog = hour;
    if (DRIZZLE.has(code) && stats.drizzleHours++ === 0) stats.firstDrizzle = hour;
    if (code === 0) stats.clearHours++;
    if (getIceRisk(history, i) === 'likely' && stats.iceHours++ === 0) stats.firstIce = hour;
    if (hour > 0 && precipitation >= 0.1 !== history.precipitation[i - 1] >= 0.1) {
      stats.rainChanges++;
    }
  }
  return stats;
}

function pick(days: DayStats[], score: (stats: DayStats) => number) {
  return days.reduce((best, stats) => (score(stats) > score(best) ? stats : best));
}

/** The hours before an event are shown too, so start a little ahead of it */
const before = (day: number, hour: number) => timeAt(day, Math.max(0, hour - 1)).getTime();

let cached: Highlight[] | undefined;

/** Days worth looking at, found by scanning the dataset: the extremes and the awkward cases */
export function getHighlights(): Highlight[] {
  if (cached) return cached;

  // The first and last day can't be "today" (see FIRST_AT/LAST_AT in history.ts)
  const days = Array.from({ length: DAYS - 2 }, (_, i) => getDayStats(i + 1));
  const hot = pick(days, (d) => d.max);
  const cold = pick(days, (d) => -d.min);
  const wet = pick(days, (d) => d.rain);
  const downpour = pick(days, (d) => d.rainiestHourAmount);
  const snow = pick(days, (d) => d.snowHours);
  const fog = pick(days, (d) => d.fogHours);
  const drizzle = pick(days, (d) => d.drizzleHours);
  const changeable = pick(days, (d) => d.rainChanges);
  const icy = pick(days, (d) => d.iceHours);
  const frost = pick(
    days.filter((d) => d.min < -2 && d.clearHours >= 8),
    (d) => -d.min,
  );
  const dry = pick(
    days.filter((d) => d.rain === 0),
    (d) => d.clearHours,
  );

  cached = [
    { label: 'Warmste dag', at: before(hot.day, hot.maxHour) },
    { label: 'Koudste dag', at: before(cold.day, cold.minHour) },
    { label: 'Natste dag', at: before(wet.day, 6) },
    { label: 'Hevigste bui', at: before(downpour.day, downpour.rainiestHour) },
    { label: 'Wisselvallig', at: before(changeable.day, 8) },
    { label: 'Motregen', at: before(drizzle.day, drizzle.firstDrizzle) },
    { label: 'Sneeuw', at: before(snow.day, snow.firstSnow) },
    { label: 'Mist', at: before(fog.day, fog.firstFog) },
    { label: 'Heldere vorst', at: before(frost.day, 18) },
    { label: 'Gladheid', at: before(icy.day, icy.firstIce) },
    { label: 'Zonnig en droog', at: before(dry.day, 12) },
  ];
  return cached;
}
