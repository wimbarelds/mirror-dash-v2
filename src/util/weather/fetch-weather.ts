import { fetchWeatherApi } from 'openmeteo';

const params = {
  latitude: 53.247072,
  longitude: 6.588939,
  current: [
    'temperature_2m',
    'apparent_temperature',
    'precipitation',
    'weather_code',
  ],
  hourly: [
    'temperature_2m',
    'apparent_temperature',
    'precipitation_probability',
    'precipitation',
    'weather_code',
  ],
  daily: [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'apparent_temperature_max',
    'apparent_temperature_min',
    'precipitation_sum',
    'precipitation_probability_max',
  ],
  timezone: 'Europe/Amsterdam',
} as const;
const url = 'https://api.open-meteo.com/v1/forecast';

function dates(...args: [bigint, bigint, number]) {
  const start = Number(args[0]) * 1000;
  const stop = Number(args[1]) * 1000;
  const step = args[2] * 1000;

  return new Array((Number(stop) - Number(start)) / step)
    .fill(null)
    .map((_, i) => new Date(Number(start) + i * step));
}

type WeatherApiResponse = Awaited<ReturnType<typeof fetchWeatherApi>>[number];
type VariableWithValuesFn = Exclude<
  ReturnType<WeatherApiResponse['current']>,
  null
>['variables'];
type VariableWithValues = ReturnType<VariableWithValuesFn>;

type ParamValueCallback = (variables: VariableWithValues) => unknown;
type ParamValueObject<
  TKeys extends readonly string[],
  TCallback extends ParamValueCallback,
> = { [key in TKeys[number]]: ReturnType<TCallback> };

function getParamValueObject<
  TParams extends readonly string[],
  TCallback extends ParamValueCallback,
>(
  variablesFn: VariableWithValuesFn,
  params: TParams,
  valueCallback: TCallback,
): ParamValueObject<TParams, TCallback> {
  const result: Record<string, ReturnType<TCallback>> = {};
  params.forEach((param, paramIndex) => {
    const variables = variablesFn(paramIndex);
    result[param] = valueCallback(variables) as ReturnType<TCallback>;
  });
  return result as ParamValueObject<TParams, TCallback>;
}

function getWeatherData(result: WeatherApiResponse) {
  const current = result.current();
  const hourly = result.hourly();
  const daily = result.daily();
  const utcOffsetSeconds = result.utcOffsetSeconds();
  if (!current || !hourly || !daily) return null;

  return {
    current: {
      time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
      ...getParamValueObject(
        current.variables.bind(current),
        params.current,
        (obj) => obj?.value(),
      ),
    },
    hourly: {
      time: dates(hourly.time(), hourly.timeEnd(), hourly.interval()),
      ...getParamValueObject(
        hourly.variables.bind(hourly),
        params.hourly,
        (obj) => Array.from(obj?.valuesArray() ?? []),
      ),
    },
    daily: {
      time: dates(daily.time(), daily.timeEnd(), daily.interval()),
      ...getParamValueObject(daily.variables.bind(daily), params.daily, (obj) =>
        Array.from(obj?.valuesArray() ?? []),
      ),
    },
  };
}

export function fetchWeatherData() {
  return fetchWeatherApi(url, params)
    .then(([result]) => result)
    .then((data) => getWeatherData(data));
}
