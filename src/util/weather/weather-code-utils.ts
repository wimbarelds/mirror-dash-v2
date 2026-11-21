import { Info, weather_code_info } from './constants';

const UNKNOWN: Info = { description: 'Onbekend', icon: 'cloudy' };

export function getWeatherCodeInfo(weather_code: number, night = false): Info {
  // An unknown code must not throw: an error while rendering takes the whole page down
  return weather_code_info[weather_code]?.[night ? 'night' : 'day'] ?? UNKNOWN;
}
