/**
 * Downloads a block of hourly weather history for the replay page (replay.html).
 *
 *   node scripts/fetch-replay-weather.mjs 2025-11-17 2026-11-18
 *
 * Uses Open-Meteo's historical forecast API, which keeps the archived model forecasts. Unlike the
 * plain archive API it includes precipitation probability, which the graph needs. Times are local
 * (Europe/Amsterdam), 24 values per day.
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const [, , start, end] = process.argv;
if (!/^\d{4}-\d{2}-\d{2}$/.test(start ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(end ?? '')) {
  console.error('Usage: node scripts/fetch-replay-weather.mjs <start YYYY-MM-DD> <end YYYY-MM-DD>');
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
];
const DAY = 24 * 60 * 60 * 1000;
const CHUNK_DAYS = 90;

const toDate = (value) => new Date(`${value}T00:00:00Z`);
const toIso = (date) => date.toISOString().slice(0, 10);

const columns = Object.fromEntries(VARIABLES.map((name) => [name, []]));

for (let cursor = toDate(start); cursor <= toDate(end); ) {
  const chunkEnd = new Date(Math.min(cursor.getTime() + (CHUNK_DAYS - 1) * DAY, toDate(end)));
  const url = new URL('https://historical-forecast-api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: LATITUDE,
    longitude: LONGITUDE,
    start_date: toIso(cursor),
    end_date: toIso(chunkEnd),
    hourly: VARIABLES.join(','),
    timezone: 'Europe/Amsterdam',
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
  const { hourly } = await response.json();
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

mkdirSync('src/replay', { recursive: true });
writeFileSync('src/replay/weather-history.json', JSON.stringify({ start, hours, ...columns }));
console.log(`Wrote src/replay/weather-history.json (${hours} hours from ${start})`);
