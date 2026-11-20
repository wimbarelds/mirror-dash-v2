export type WeatherIconKind =
  | 'clear-day'
  | 'clear-night'
  | 'partly-day'
  | 'partly-night'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'thunder';

export interface Info {
  description: string;
  icon: WeatherIconKind;
}

interface CodeItem {
  day: Info;
  night: Info;
}

const always = (description: string, icon: WeatherIconKind): CodeItem => ({
  day: { description, icon },
  night: { description, icon },
});

// WMO weather interpretation codes, as returned by Open-Meteo
export const weather_code_info: Record<number, CodeItem> = {
  0: {
    day: { description: 'Zonnig', icon: 'clear-day' },
    night: { description: 'Helder', icon: 'clear-night' },
  },
  1: {
    day: { description: 'Voornamelijk zonnig', icon: 'clear-day' },
    night: { description: 'Voornamelijk helder', icon: 'clear-night' },
  },
  2: {
    day: { description: 'Gedeeltelijk bewolkt', icon: 'partly-day' },
    night: { description: 'Gedeeltelijk bewolkt', icon: 'partly-night' },
  },
  3: always('Bewolkt', 'cloudy'),
  45: always('Mistig', 'fog'),
  48: always('Bevroren mist', 'fog'),
  51: always('Lichte motregen', 'rain'),
  53: always('Motregen', 'rain'),
  55: always('Zware motregen', 'rain'),
  56: always('Lichte onderkoelde motregen', 'rain'),
  57: always('Onderkoelde motregen', 'rain'),
  61: always('Lichte regen', 'rain'),
  63: always('Regen', 'rain'),
  65: always('Zware regen', 'rain'),
  66: always('Lichte ijzelregen', 'rain'),
  67: always('Ijzelregen', 'rain'),
  71: always('Lichte sneeuw', 'snow'),
  73: always('Sneeuw', 'snow'),
  75: always('Zware sneeuw', 'snow'),
  77: always('Sneeuwkorrels', 'snow'),
  80: always('Lichte regenbuien', 'rain'),
  81: always('Regenbuien', 'rain'),
  82: always('Zware regenbuien', 'rain'),
  85: always('Lichte sneeuwbuien', 'snow'),
  86: always('Sneeuwbuien', 'snow'),
  95: always('Onweer', 'thunder'),
  96: always('Lichte onweersbuien met hagel', 'thunder'),
  99: always('Onweersbuien met hagel', 'thunder'),
};

export const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

/** Every code that means something is falling: drizzle, rain, snow, showers and thunderstorms */
export const PRECIPITATION_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99,
]);
