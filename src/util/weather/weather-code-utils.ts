import { weather_code_info } from './constants';

export function getWeatherCodeInfo(weather_code: number, night = false) {
  // An unknown code must not throw: an error while rendering takes the whole page down
  const info = weather_code_info[weather_code] ?? weather_code_info[3];
  const { description, image } = info[night ? 'night' : 'day'];
  return { description: weather_code in weather_code_info ? description : 'Onbekend', image };
}
