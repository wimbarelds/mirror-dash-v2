import { useEffect, useMemo, useState } from 'react';
import { useWeatherData } from '../util/weather/use-weather-data';
import { WeatherGraph } from './WeatherGraph/WeatherGraph';
import { Point } from './WeatherGraph/types';

function isNext24Hours(date: Date, now: number) {
  const from = now - 1000 * 60 * 60 * 2;
  const end = from + 1000 * 60 * 60 * 25;
  const test = date.getTime();
  return test >= from && test <= end;
}

export function WeatherForecast() {
  const { data } = useWeatherData();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [now, setNow] = useState(Date.now());
  const [size, setSize] = useState<Point | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setNow(Date.now()), 1000 * 60 * 5);
    return () => clearTimeout(timeout);
  }, [now]);

  const dataPoints = useMemo(() => {
    if (!container) return [];
    if (!data) return [];

    const todayHours = data.hourly.time.filter((value) =>
      isNext24Hours(value, now),
    );
    const indexes = todayHours.map((item) => data.hourly.time.indexOf(item));
    return indexes.map((i) => {
      return {
        temperature: data.hourly.temperature_2m[i],
        precipProbability: data.hourly.precipitation_probability[i],
        precipIntensity: data.hourly.precipitation[i] / 3,
        time: data.hourly.time[i].getTime(),
      };
    });
  }, [data, now, container]);

  useEffect(() => {
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const newSize = {
        x: container.clientWidth,
        y: Math.max(240, Math.min(screen.availHeight - 600, 100)),
      };
      if (!size || size.x !== newSize.x || size.y !== newSize.y) {
        setSize({
          x: container.clientWidth,
          y: Math.max(240, Math.min(screen.availHeight - 600, 100)),
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [size, container]);

  return (
    <div ref={setContainer}>
      {size && <WeatherGraph datapoints={dataPoints} size={size} />}
    </div>
  );
}
