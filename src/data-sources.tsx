import { createContext, useContext } from 'react';

import { getOVData } from './util/ov/fetch-ov';
import { TimingPoint } from './util/ov/schema';
import { fetchWeatherData, WeatherData } from './util/weather/fetch-weather';

/** Everything the app gets from outside: the clock and the data. Mock data provides its own. */
export interface DataSources {
  /** Query key: live data keeps one, mock data changes it with the data */
  key: string;
  /** Whether time moves by itself */
  live: boolean;
  /** The current time in ms */
  now: () => number;
  fetchWeather: () => Promise<WeatherData | null>;
  fetchBusses: () => Promise<TimingPoint>;
}

export const liveDataSources: DataSources = {
  key: 'live',
  live: true,
  now: () => Date.now(),
  fetchWeather: fetchWeatherData,
  fetchBusses: getOVData,
};

const DataSourcesContext = createContext<DataSources>(liveDataSources);

export const DataSourcesProvider = DataSourcesContext.Provider;
export const useDataSources = () => useContext(DataSourcesContext);
