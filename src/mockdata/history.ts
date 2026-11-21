import { HOUR } from '../util/time';
import raw from './weather-history.json';

/** Hourly weather from scripts/fetch-mockdata-weather.ts: local time, 24 values a day */
export const history = raw;

const [startYear, startMonth, startDay] = history.start.split('-').map(Number);

export const DAYS = history.hours / 24;

/** Local time on a day of the dataset (day 0 is `start`) */
export const timeAt = (dayIndex: number, hour = 0) =>
  new Date(startYear, startMonth - 1, startDay + dayIndex, hour);

/** Position in the hourly arrays of the hour that contains the given moment */
export function hourIndexAt(at: number) {
  const date = new Date(at);
  const dayIndex = Math.round(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(startYear, startMonth - 1, startDay)) /
      (24 * HOUR),
  );
  return dayIndex * 24 + date.getHours();
}

/** The first and last day can't be "today": the app looks back two hours and ahead to tomorrow */
export const FIRST_AT = timeAt(1).getTime();
export const LAST_AT = timeAt(DAYS - 1).getTime() - 60_000;

export const clampAt = (at: number) => Math.min(LAST_AT, Math.max(FIRST_AT, at));
