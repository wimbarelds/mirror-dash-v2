import { ReactNode } from 'react';

import { WeatherIconKind } from '../util/weather/constants';

const CLOUD = <path d="M32 76h66a22 22 0 0 0 2-44 32 32 0 0 0-60-6A25 25 0 0 0 32 76z" />;
const SUN = (
  <>
    <circle cx="65" cy="55" r="20" />
    <path d="M65 18v10M65 82v10M28 55h10M92 55h10M39 29l7 7M84 74l7 7M39 81l7-7M84 36l7-7" />
  </>
);
const MOON = <path d="M82 28a32 32 0 1 0 22 52 26 26 0 0 1-22-52z" />;
const SMALL_CLOUD = <g transform="translate(16 12) scale(.82)">{CLOUD}</g>;

const icons: Record<WeatherIconKind, ReactNode> = {
  'clear-day': SUN,
  'clear-night': MOON,
  'partly-day': (
    <>
      <circle cx="40" cy="38" r="14" />
      <path d="M40 12v6M14 38h6M21 19l4 4M59 19l-4 4" />
      {SMALL_CLOUD}
    </>
  ),
  'partly-night': (
    <>
      <path d="M52 18a20 20 0 1 0 16 34 16 16 0 0 1-16-34z" />
      {SMALL_CLOUD}
    </>
  ),
  'cloudy': CLOUD,
  'fog': (
    <>
      {CLOUD}
      <path d="M36 88h58M46 98h58" />
    </>
  ),
  'rain': (
    <>
      {CLOUD}
      <path d="M46 86l-6 14M66 86l-6 14M86 86l-6 14" />
    </>
  ),
  'snow': (
    <>
      {CLOUD}
      <path strokeWidth="9" d="M46 90h.1M66 90h.1M86 90h.1M56 102h.1M76 102h.1" />
    </>
  ),
  'thunder': (
    <>
      {CLOUD}
      <path d="M70 80l-12 14h14l-10 14" />
    </>
  ),
};

export function WeatherIcon({ kind, className }: { kind: WeatherIconKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 130 110"
      fill="none"
      stroke="white"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {icons[kind]}
    </svg>
  );
}
