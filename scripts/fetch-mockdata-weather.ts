#!/usr/bin/env node
/**
 * Downloads a block of hourly weather history for the mock data page (mockdata.html).
 *
 *   vpx scripts/fetch-mockdata-weather.ts 2024-12-31 2026-01-01
 *
 * Uses Open-Meteo's historical forecast API, which keeps the archived model forecasts. Unlike the
 * plain archive API it includes precipitation probability, which the graph needs. Times are local
 * (Europe/Amsterdam), 24 values per day.
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const [, , start, end] = process.argv;
const isDate = (value: string | undefined): value is string =>
  /^\d{4}-\d{2}-\d{2}$/.test(value ?? '');

if (!isDate(start) || !isDate(end)) {
  console.error('Usage: vpx scripts/fetch-mockdata-weather.ts <start YYYY-MM-DD> <end YYYY-MM-DD>');
  process.exit(1);
}

const LATITUDE = 53.247072;
const LONGITUDE = 6.588939;
const VARIABLES = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation',
  'precipitation_probability',
  'weather_code',
  'is_day',
  'soil_temperature_0cm',
  'relative_humidity_2m',
] as const;
const DAY = 24 * 60 * 60 * 1000;
const CHUNK_DAYS = 90;

type Variable = (typeof VARIABLES)[number];
type Hourly = Record<Variable, (number | null)[]> & { time: string[] };

const toDate = (value: string) => new Date(`${value}T00:00:00Z`);
const toIso = (date: Date) => date.toISOString().slice(0, 10);

const columns = Object.fromEntries(
  VARIABLES.map((name) => [name, [] as (number | null)[]]),
) as Record<Variable, (number | null)[]>;

for (let cursor = toDate(start); cursor <= toDate(end);) {
  const chunkEnd = new Date(
    Math.min(cursor.getTime() + (CHUNK_DAYS - 1) * DAY, toDate(end).getTime()),
  );
  const url = new URL('https://historical-forecast-api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(LATITUDE),
    longitude: String(LONGITUDE),
    start_date: toIso(cursor),
    end_date: toIso(chunkEnd),
    hourly: VARIABLES.join(','),
    timezone: 'Europe/Amsterdam',
  }).toString();

  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
  const { hourly } = (await response.json()) as { hourly: Hourly };
  for (const name of VARIABLES) columns[name].push(...hourly[name]);

  console.log(`${toIso(cursor)} .. ${toIso(chunkEnd)}: ${hourly.time.length} hours`);
  cursor = new Date(chunkEnd.getTime() + DAY);
}

const hours = columns.temperature_2m.length;
for (const name of VARIABLES) {
  if (columns[name].length !== hours || columns[name].includes(null)) {
    throw new Error(`Incomplete data for ${name}`);
  }
}

mkdirSync('src/mockdata', { recursive: true });
writeFileSync('src/mockdata/weather-history.json', JSON.stringify({ start, hours, ...columns }));
console.log(`Wrote src/mockdata/weather-history.json (${hours} hours from ${start})`);
