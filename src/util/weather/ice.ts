import { SNOW_CODES } from './constants';

export type IceRisk = 'none' | 'possible' | 'likely';

/** Freezing drizzle and freezing rain: they ice up roads wherever they fall */
const FREEZING_RAIN_CODES = new Set([56, 57, 66, 67]);

/** The road is likely frozen at or below this surface temperature (°C), possibly a little above it */
const FROZEN_SURFACE = 0;
const NEAR_FROZEN_SURFACE = 1.5;

/** Moisture counts as present when there was rain or snow in this many hours, or the air is damp */
const LOOKBACK_HOURS = 6;
const DAMP_HUMIDITY = 90;

interface HourlyIceInput {
  weather_code: number[];
  precipitation: number[];
  soil_temperature_0cm: number[];
  relative_humidity_2m: number[];
}

/**
 * Risk of slippery roads at an hour, from the forecast. This is a rule of thumb, not a road report:
 * a (near) freezing surface with moisture on it, or freezing rain. The surface temperature is the
 * weather model's 0 cm temperature, which follows the road surface better than the air temperature.
 */
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
