import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { DataSources, DataSourcesProvider } from '../data-sources';
import { buildBusData } from './build-bus-data';
import { buildWeatherData } from './build-weather-data';
import { clampAt, DAYS, timeAt } from './history';
import { DataPart, MockDataContext, SimulatedError } from './mockdata-context';
import { simulateError } from './simulate-error';

const HOUR = 60 * 60 * 1000;
const PLAY_INTERVAL = 700;

const pad = (value: number) => String(value).padStart(2, '0');

/** The format used in the URL, e.g. 2026-06-26T14:30 (local time) */
export function formatAt(at: number) {
  const date = new Date(at);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function readInitialAt() {
  const param = new URLSearchParams(window.location.search).get('t');
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(param ?? '');
  if (match) {
    const [year, month, day, hour, minute] = match.slice(1).map(Number);
    return clampAt(new Date(year, month - 1, day, hour, minute).getTime());
  }
  // The evening of the latest day that can be used
  return clampAt(timeAt(DAYS - 2, 19).getTime() + 30 * 60 * 1000);
}

/**
 * Runs the app against recorded weather and a simulated clock. The moment being shown lives in
 * the URL (?t=2026-06-26T14:30), so any situation can be bookmarked or shared.
 */
export function MockDataProvider({ children }: { children: ReactNode }) {
  const [at, setAtUnclamped] = useState(readInitialAt);
  const [playing, setPlaying] = useState(false);
  const [errors, setErrors] = useState<Record<DataPart, SimulatedError>>({
    weather: 'none',
    buses: 'none',
  });
  const setError = useCallback(
    (part: DataPart, error: SimulatedError) =>
      setErrors((current) => ({ ...current, [part]: error })),
    [],
  );
  const setAt = useCallback((next: number) => setAtUnclamped(clampAt(next)), []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('t', formatAt(at));
    window.history.replaceState(null, '', url);
  }, [at]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(
      () => setAtUnclamped((current) => clampAt(current + HOUR)),
      PLAY_INTERVAL,
    );
    return () => clearInterval(interval);
  }, [playing]);

  const dataSources = useMemo<DataSources>(
    () => ({
      key: `mockdata-${at}-${errors.weather}-${errors.buses}`,
      live: false,
      now: () => at,
      fetchWeather: () =>
        errors.weather === 'none'
          ? Promise.resolve(buildWeatherData(at))
          : simulateError('weather', errors.weather),
      fetchBuses: () =>
        errors.buses === 'none'
          ? Promise.resolve(buildBusData(at))
          : simulateError('buses', errors.buses),
    }),
    [at, errors],
  );

  const mockData = useMemo(
    () => ({ at, setAt, playing, setPlaying, errors, setError }),
    [at, setAt, playing, errors, setError],
  );

  return (
    <MockDataContext.Provider value={mockData}>
      <DataSourcesProvider value={dataSources}>{children}</DataSourcesProvider>
    </MockDataContext.Provider>
  );
}
