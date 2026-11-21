import { SNOW_CODES } from '../util/weather/constants';
import { getIceRisk } from '../util/weather/ice';
import { DAYS, history, timeAt } from './history';

export interface Highlight {
  label: string;
  /** A little before the interesting weather starts, so it is inside the graph */
  at: number;
}

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export const SEASONS: { id: Season; label: string; months: string }[] = [
  { id: 'winter', label: 'Winter', months: 'dec – feb' },
  { id: 'spring', label: 'Lente', months: 'mrt – mei' },
  { id: 'summer', label: 'Zomer', months: 'jun – aug' },
  { id: 'autumn', label: 'Herfst', months: 'sep – nov' },
];

/** Meteorological seasons */
export const seasonOf = (month: number): Season =>
  month === 11 || month <= 1 ? 'winter' : month <= 4 ? 'spring' : month <= 7 ? 'summer' : 'autumn';

const FOG_CODES = new Set([45, 48]);
const DRIZZLE_CODES = new Set([51, 53, 55, 56, 57]);

/** How many hours of a day match something, and the first of them */
interface Occurrence {
  hours: number;
  first: number;
}

interface DayStats {
  day: number;
  max: number;
  maxHour: number;
  min: number;
  minHour: number;
  rain: number;
  rainiestAmount: number;
  rainiestHour: number;
  rainChanges: number;
  clearHours: number;
  cloudyHours: number;
  wet: Occurrence;
  snow: Occurrence;
  fog: Occurrence;
  drizzle: Occurrence;
  ice: Occurrence;
}

function getDayStats(day: number): DayStats {
  const hours = Array.from({ length: 24 }, (_, hour) => day * 24 + hour);
  const temperatures = hours.map((i) => history.temperature_2m[i]);
  const precipitation = hours.map((i) => history.precipitation[i]);
  const code = (i: number) => history.weather_code[i];
  const isWet = (i: number) => history.precipitation[i] >= 0.1;

  const occurrence = (test: (i: number) => boolean): Occurrence => ({
    hours: hours.filter(test).length,
    first: Math.max(0, hours.findIndex(test)),
  });

  const max = Math.max(...temperatures);
  const min = Math.min(...temperatures);
  const rainiestAmount = Math.max(...precipitation);

  return {
    day,
    max,
    maxHour: temperatures.indexOf(max),
    min,
    minHour: temperatures.indexOf(min),
    rain: precipitation.reduce((total, mm) => total + mm, 0),
    rainiestAmount,
    rainiestHour: precipitation.indexOf(rainiestAmount),
    rainChanges: hours.filter((i, hour) => hour > 0 && isWet(i) !== isWet(i - 1)).length,
    clearHours: hours.filter((i) => code(i) === 0).length,
    cloudyHours: hours.filter((i) => code(i) === 3).length,
    wet: occurrence(isWet),
    snow: occurrence((i) => SNOW_CODES.has(code(i))),
    fog: occurrence((i) => FOG_CODES.has(code(i))),
    drizzle: occurrence((i) => DRIZZLE_CODES.has(code(i))),
    ice: occurrence((i) => getIceRisk(history, i) === 'likely'),
  };
}

/** A kind of day worth showing. The best day of a season is offered when it scores at least `min`. */
interface Category {
  label: string;
  score: (day: DayStats) => number;
  min: number;
  /** Hour to start at */
  hour: (day: DayStats) => number;
}

const NEVER = -Infinity;

const CATEGORIES: Category[] = [
  { label: 'Warmste dag', score: (d) => d.max, min: NEVER, hour: (d) => d.maxHour },
  { label: 'Koudste dag', score: (d) => -d.min, min: NEVER, hour: (d) => d.minHour },
  {
    label: 'Zonnig en droog',
    score: (d) => (d.rain === 0 ? d.clearHours : NEVER),
    min: 8,
    hour: () => 12,
  },
  {
    label: 'Grijs en droog',
    score: (d) => (d.rain === 0 ? d.cloudyHours : NEVER),
    min: 16,
    hour: () => 12,
  },
  { label: 'Natste dag', score: (d) => d.rain, min: 2, hour: () => 6 },
  { label: 'Hevigste bui', score: (d) => d.rainiestAmount, min: 2, hour: (d) => d.rainiestHour },
  { label: 'Lange regen', score: (d) => d.wet.hours, min: 8, hour: () => 6 },
  { label: 'Wisselvallig', score: (d) => d.rainChanges, min: 3, hour: () => 8 },
  { label: 'Motregen', score: (d) => d.drizzle.hours, min: 3, hour: (d) => d.drizzle.first },
  { label: 'Mist', score: (d) => d.fog.hours, min: 3, hour: (d) => d.fog.first },
  { label: 'Sneeuw', score: (d) => d.snow.hours, min: 3, hour: (d) => d.snow.first },
  {
    label: 'Heldere vorst',
    score: (d) => (d.clearHours >= 8 ? -d.min : NEVER),
    min: 1,
    hour: () => 18,
  },
  { label: 'Gladheid', score: (d) => d.ice.hours, min: 2, hour: (d) => d.ice.first },
];

/** Notable days per season. Only what happened in a season is offered, each on its own day. */
export function getHighlights(): Record<Season, Highlight[]> {
  const seasons: Record<Season, DayStats[]> = { winter: [], spring: [], summer: [], autumn: [] };
  // The first and last day of the data can't be "today"
  for (let day = 1; day < DAYS - 1; day++) {
    seasons[seasonOf(timeAt(day).getMonth())].push(getDayStats(day));
  }

  const highlights = {} as Record<Season, Highlight[]>;
  for (const [season, days] of Object.entries(seasons) as [Season, DayStats[]][]) {
    const used = new Set<number>();

    highlights[season] = CATEGORIES.flatMap(({ label, score, min, hour }) => {
      const candidates = days.filter((d) => !used.has(d.day) && score(d) >= min);
      if (candidates.length === 0) return [];

      const best = candidates.reduce((a, b) => (score(b) > score(a) ? b : a));
      used.add(best.day);
      return [{ label, at: timeAt(best.day, Math.max(0, hour(best) - 1)).getTime() }];
    });
  }
  return highlights;
}
