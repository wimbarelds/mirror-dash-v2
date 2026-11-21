import { SNOW_CODES } from './constants';

export type IceRisk = 'none' | 'possible' | 'likely';

/** Freezing drizzle and rain */
const FREEZING_RAIN_CODES = new Set([56, 57, 66, 67]);

/** Surface temperatures (°C) at or below which the road is likely / possibly frozen */
const FROZEN_SURFACE = 0;
const NEAR_FROZEN_SURFACE = 1.5;

/** Moisture: rain or snow within this many hours, or damp air */
const LOOKBACK_HOURS = 6;
const DAMP_HUMIDITY = 90;

interface HourlyIceInput {
  weather_code: number[];
  precipitation: number[];
  soil_temperature_0cm: number[];
  relative_humidity_2m: number[];
}

/** Rule of thumb for slippery roads: a (near) freezing surface with moisture, or freezing rain */
export function getIceRisk(hourly: HourlyIceInput, index: number): IceRisk {
  if (FREEZING_RAIN_CODES.has(hourly.weather_code[index])) return 'likely';

  const surface = hourly.soil_temperature_0cm[index];
  if (surface > NEAR_FROZEN_SURFACE) return 'none';

  let damp = hourly.relative_humidity_2m[index] >= DAMP_HUMIDITY;
  for (let i = Math.max(0, index - LOOKBACK_HOURS); i <= index && !damp; i++) {
    damp = hourly.precipitation[i] >= 0.1 || SNOW_CODES.has(hourly.weather_code[i]);
  }
  if (!damp) return 'none';

  return surface <= FROZEN_SURFACE ? 'likely' : 'possible';
}
