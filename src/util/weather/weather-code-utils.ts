import { weather_code_info } from './constants';

export function getWeatherCodeInfo(weather_code: number, night = false) {
  if (!(weather_code in weather_code_info))
    throw new Error('Missing weather code');

  return weather_code_info[weather_code][night ? 'night' : 'day'];
}
