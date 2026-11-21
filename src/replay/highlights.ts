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
  wetHours: number;
  cloudyHours: number;
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
    wetHours: 0,
    cloudyHours: 0,
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
    if (code === 3) stats.cloudyHours++;
    if (precipitation >= 0.1) stats.wetHours++;
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

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export const SEASONS: { id: Season; label: string; months: string }[] = [
  { id: 'winter', label: 'Winter', months: 'dec – feb' },
  { id: 'spring', label: 'Lente', months: 'mrt – mei' },
  { id: 'summer', label: 'Zomer', months: 'jun – aug' },
  { id: 'autumn', label: 'Herfst', months: 'sep – nov' },
];

/** Meteorological seasons, as that is how the weather groups itself */
const seasonOf = (month: number): Season =>
  month === 11 || month <= 1 ? 'winter' : month <= 4 ? 'spring' : month <= 7 ? 'summer' : 'autumn';

/** What is worth showing: a label, which day scores highest, and whether the best one is any good */
interface Category {
  label: string;
  score: (stats: DayStats) => number;
  /** The best day of a season is only offered when it qualifies */
  qualifies: (stats: DayStats) => boolean;
  /** The hour to start at, so the interesting part is in the graph */
  hour: (stats: DayStats) => number;
}

const CATEGORIES: Category[] = [
  { label: 'Warmste dag', score: (d) => d.max, qualifies: () => true, hour: (d) => d.maxHour },
  { label: 'Koudste dag', score: (d) => -d.min, qualifies: () => true, hour: (d) => d.minHour },
  {
    label: 'Zonnig en droog',
    score: (d) => (d.rain === 0 ? d.clearHours : -1),
    qualifies: (d) => d.rain === 0 && d.clearHours >= 8,
    hour: () => 12,
  },
  {
    label: 'Grijs en droog',
    score: (d) => (d.rain === 0 ? d.cloudyHours : -1),
    qualifies: (d) => d.rain === 0 && d.cloudyHours >= 16,
    hour: () => 12,
  },
  { label: 'Natste dag', score: (d) => d.rain, qualifies: (d) => d.rain >= 2, hour: () => 6 },
  {
    label: 'Hevigste bui',
    score: (d) => d.rainiestHourAmount,
    qualifies: (d) => d.rainiestHourAmount >= 2,
    hour: (d) => d.rainiestHour,
  },
  {
    label: 'Lange regen',
    score: (d) => d.wetHours,
    qualifies: (d) => d.wetHours >= 8,
    hour: () => 6,
  },
  {
    label: 'Wisselvallig',
    score: (d) => d.rainChanges,
    qualifies: (d) => d.rainChanges >= 3,
    hour: () => 8,
  },
  {
    label: 'Motregen',
    score: (d) => d.drizzleHours,
    qualifies: (d) => d.drizzleHours >= 3,
    hour: (d) => d.firstDrizzle,
  },
  {
    label: 'Mist',
    score: (d) => d.fogHours,
    qualifies: (d) => d.fogHours >= 3,
    hour: (d) => d.firstFog,
  },
  {
    label: 'Sneeuw',
    score: (d) => d.snowHours,
    qualifies: (d) => d.snowHours >= 3,
    hour: (d) => d.firstSnow,
  },
  {
    label: 'Heldere vorst',
    score: (d) => (d.clearHours >= 8 ? -d.min : -99),
    qualifies: (d) => d.min < -1 && d.clearHours >= 8,
    hour: () => 18,
  },
  {
    label: 'Gladheid',
    score: (d) => d.iceHours,
    qualifies: (d) => d.iceHours >= 2,
    hour: (d) => d.firstIce,
  },
];

let cached: Record<Season, Highlight[]> | undefined;

/**
 * Notable days per season, found by scanning the dataset: the extremes and the awkward cases. Only
 * what actually happened in a season is offered, so summer has no snow.
 */
export function getHighlights(): Record<Season, Highlight[]> {
  if (cached) return cached;

  // The first and last day can't be "today" (see FIRST_AT/LAST_AT in history.ts)
  const bySeason: Record<Season, DayStats[]> = { winter: [], spring: [], summer: [], autumn: [] };
  for (let day = 1; day < DAYS - 1; day++) {
    bySeason[seasonOf(timeAt(day).getMonth())].push(getDayStats(day));
  }

  const result = {} as Record<Season, Highlight[]>;
  for (const { id } of SEASONS) {
    // Every button gets a day of its own, so choosing one never lights up another
    const used = new Set<number>();
    result[id] = CATEGORIES.flatMap((category) => {
      const candidates = bySeason[id].filter(
        (day) => !used.has(day.day) && category.qualifies(day),
      );
      if (candidates.length === 0) return [];
      const best = pick(candidates, category.score);
      used.add(best.day);
      return [{ label: category.label, at: before(best.day, category.hour(best)) }];
    });
  }

  cached = result;
  return cached;
}
