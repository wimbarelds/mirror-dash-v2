import raw from './weather-history.json';

/**
 * Recorded hourly weather, created by scripts/fetch-mockdata-weather.mjs. Times are local, 24 values
 * per day, starting at midnight of `start`.
 *
 * The values are read as local time in whichever timezone the browser is in, so a replayed 08:30
 * always shows the weather recorded for 08:30. (On the two daylight saving days a year the clock
 * has 23 or 25 hours, so one hour is missing or doubled; that's fine for testing the layout.)
 */
export const history = raw;

const [startYear, startMonth, startDay] = history.start.split('-').map(Number);
const HOUR = 60 * 60 * 1000;

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

/**
 * The selectable range. The graph looks two hours back and the app shows tomorrow's summary, so the
 * first and last day of the dataset can't be used as a "today".
 */
export const FIRST_AT = timeAt(1).getTime();
export const LAST_AT = timeAt(DAYS - 1).getTime() - 60_000;

export const clampAt = (at: number) => Math.min(LAST_AT, Math.max(FIRST_AT, at));
