import { createContext, useContext } from 'react';

import { getOVData } from './util/ov/fetch-ov';
import { TimingPoint } from './util/ov/schema';
import { fetchWeatherData, WeatherData } from './util/weather/fetch-weather';

/**
 * Everything the app gets from the outside world: the clock and both data sources. The real ones are
 * the default. The mock data page (mockdata.html) provides its own, driven by recorded weather and a
 * simulated clock, without the main page ever loading any of that code or data.
 */
export interface DataSources {
  /** Live data keeps one key; the mock data page changes it whenever the data would change */
  key: string;
  /** Whether time moves by itself. The mock data page moves it by hand and re-renders the app when it does */
  live: boolean;
  /** The current time in ms */
  now: () => number;
  fetchWeather: () => Promise<WeatherData | null>;
  fetchBuses: () => Promise<TimingPoint>;
}

export const liveDataSources: DataSources = {
  key: 'live',
  live: true,
  now: () => Date.now(),
  fetchWeather: fetchWeatherData,
  fetchBuses: getOVData,
};

const DataSourcesContext = createContext<DataSources>(liveDataSources);

export const DataSourcesProvider = DataSourcesContext.Provider;
export const useDataSources = () => useContext(DataSourcesContext);
