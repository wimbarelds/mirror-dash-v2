interface Info {
  description: string;
  image: string;
}

interface CodeItem {
  day: Info;
  night: Info;
}

export const weather_code_info: Record<number, CodeItem> = {
  '0': {
    day: {
      description: 'Zonnig',
      image: 'http://openweathermap.org/img/wn/01d@2x.png',
    },
    night: {
      description: 'Helder',
      image: 'http://openweathermap.org/img/wn/01n@2x.png',
    },
  },
  '1': {
    day: {
      description: 'Voornamelijk Zonnig',
      image: 'http://openweathermap.org/img/wn/01d@2x.png',
    },
    night: {
      description: 'Voornamelijk Helder',
      image: 'http://openweathermap.org/img/wn/01n@2x.png',
    },
  },
  '2': {
    day: {
      description: 'Gedeeltelijk Bewolkt',
      image: 'http://openweathermap.org/img/wn/02d@2x.png',
    },
    night: {
      description: 'Gedeeltelijk Bewolkt',
      image: 'http://openweathermap.org/img/wn/02n@2x.png',
    },
  },
  '3': {
    day: {
      description: 'Bewolkt',
      image: 'http://openweathermap.org/img/wn/03d@2x.png',
    },
    night: {
      description: 'Bewolkt',
      image: 'http://openweathermap.org/img/wn/03n@2x.png',
    },
  },
  '45': {
    day: {
      description: 'Mistig',
      image: 'http://openweathermap.org/img/wn/50d@2x.png',
    },
    night: {
      description: 'Mistig',
      image: 'http://openweathermap.org/img/wn/50n@2x.png',
    },
  },
  '48': {
    day: {
      description: 'Bevroren Mist',
      image: 'http://openweathermap.org/img/wn/50d@2x.png',
    },
    night: {
      description: 'Bevroren Mist',
      image: 'http://openweathermap.org/img/wn/50n@2x.png',
    },
  },
  '51': {
    day: {
      description: 'Lichte Motregen',
      image: 'http://openweathermap.org/img/wn/09d@2x.png',
    },
    night: {
      description: 'Lichte Motregen',
      image: 'http://openweathermap.org/img/wn/09n@2x.png',
    },
  },
  '53': {
    day: {
      description: 'Motregen',
      image: 'http://openweathermap.org/img/wn/09d@2x.png',
    },
    night: {
      description: 'Motregen',
      image: 'http://openweathermap.org/img/wn/09n@2x.png',
    },
  },
  '55': {
    day: {
      description: 'Zware Motregen',
      image: 'http://openweathermap.org/img/wn/09d@2x.png',
    },
    night: {
      description: 'Zware Motregen',
      image: 'http://openweathermap.org/img/wn/09n@2x.png',
    },
  },
  '56': {
    day: {
      description: 'Lichte Onderkoelde Motregen',
      image: 'http://openweathermap.org/img/wn/09d@2x.png',
    },
    night: {
      description: 'Lichte Onderkoelde Motregen',
      image: 'http://openweathermap.org/img/wn/09n@2x.png',
    },
  },
  '57': {
    day: {
      description: 'Onderkoelde Motregen',
      image: 'http://openweathermap.org/img/wn/09d@2x.png',
    },
    night: {
      description: 'Onderkoelde Motregen',
      image: 'http://openweathermap.org/img/wn/09n@2x.png',
    },
  },
  '61': {
    day: {
      description: 'Lichte Regen',
      image: 'http://openweathermap.org/img/wn/10d@2x.png',
    },
    night: {
      description: 'Lichte Regen',
      image: 'http://openweathermap.org/img/wn/10n@2x.png',
    },
  },
  '63': {
    day: {
      description: 'Regen',
      image: 'http://openweathermap.org/img/wn/10d@2x.png',
    },
    night: {
      description: 'Regen',
      image: 'http://openweathermap.org/img/wn/10n@2x.png',
    },
  },
  '65': {
    day: {
      description: 'Zware Regen',
      image: 'http://openweathermap.org/img/wn/10d@2x.png',
    },
    night: {
      description: 'Zware Regen',
      image: 'http://openweathermap.org/img/wn/10n@2x.png',
    },
  },
  '66': {
    day: {
      description: 'Lichte Ijzelregen',
      image: 'http://openweathermap.org/img/wn/10d@2x.png',
    },
    night: {
      description: 'Lichte Ijzelregen',
      image: 'http://openweathermap.org/img/wn/10n@2x.png',
    },
  },
  '67': {
    day: {
      description: 'Ijzelregen',
      image: 'http://openweathermap.org/img/wn/10d@2x.png',
    },
    night: {
      description: 'Ijzelregen',
      image: 'http://openweathermap.org/img/wn/10n@2x.png',
    },
  },
  '71': {
    day: {
      description: 'Lichte Sneeuw',
      image: 'http://openweathermap.org/img/wn/13d@2x.png',
    },
    night: {
      description: 'Lichte Sneeuw',
      image: 'http://openweathermap.org/img/wn/13n@2x.png',
    },
  },
  '73': {
    day: {
      description: 'Sneeuw',
      image: 'http://openweathermap.org/img/wn/13d@2x.png',
    },
    night: {
      description: 'Sneeuw',
      image: 'http://openweathermap.org/img/wn/13n@2x.png',
    },
  },
  '75': {
    day: {
      description: 'Zware Sneeuw',
      image: 'http://openweathermap.org/img/wn/13d@2x.png',
    },
    night: {
      description: 'Zware Sneeuw',
      image: 'http://openweathermap.org/img/wn/13n@2x.png',
    },
  },
  '77': {
    day: {
      description: 'Sneeuwkorrels',
      image: 'http://openweathermap.org/img/wn/13d@2x.png',
    },
    night: {
      description: 'Sneeuwkorrels',
      image: 'http://openweathermap.org/img/wn/13n@2x.png',
    },
  },
  '80': {
    day: {
      description: 'Lichte Regenbuien',
      image: 'http://openweathermap.org/img/wn/09d@2x.png',
    },
    night: {
      description: 'Lichte Regenbuien',
      image: 'http://openweathermap.org/img/wn/09n@2x.png',
    },
  },
  '81': {
    day: {
      description: 'Regenbuien',
      image: 'http://openweathermap.org/img/wn/09d@2x.png',
    },
    night: {
      description: 'Regenbuien',
      image: 'http://openweathermap.org/img/wn/09n@2x.png',
    },
  },
  '82': {
    day: {
      description: 'Zware Regenbuien',
      image: 'http://openweathermap.org/img/wn/09d@2x.png',
    },
    night: {
      description: 'Zware Regenbuien',
      image: 'http://openweathermap.org/img/wn/09n@2x.png',
    },
  },
  '85': {
    day: {
      description: 'Lichte Sneeuwbuien',
      image: 'http://openweathermap.org/img/wn/13d@2x.png',
    },
    night: {
      description: 'Lichte Sneeuwbuien',
      image: 'http://openweathermap.org/img/wn/13n@2x.png',
    },
  },
  '86': {
    day: {
      description: 'Sneeuwbuien',
      image: 'http://openweathermap.org/img/wn/13d@2x.png',
    },
    night: {
      description: 'Sneeuwbuien',
      image: 'http://openweathermap.org/img/wn/13n@2x.png',
    },
  },
  '95': {
    day: {
      description: 'Onweer',
      image: 'http://openweathermap.org/img/wn/11d@2x.png',
    },
    night: {
      description: 'Onweer',
      image: 'http://openweathermap.org/img/wn/11n@2x.png',
    },
  },
  '96': {
    day: {
      description: 'Lichte Onweersbuien Met Hagel',
      image: 'http://openweathermap.org/img/wn/11d@2x.png',
    },
    night: {
      description: 'Lichte Onweersbuien Met Hagel',
      image: 'http://openweathermap.org/img/wn/11n@2x.png',
    },
  },
  '99': {
    day: {
      description: 'Onweersbuien Met Hagel',
      image: 'http://openweathermap.org/img/wn/11d@2x.png',
    },
    night: {
      description: 'Onweersbuien Met Hagel',
      image: 'http://openweathermap.org/img/wn/11n@2x.png',
    },
  },
};
