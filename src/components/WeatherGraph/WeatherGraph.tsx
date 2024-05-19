import { useMemo } from 'react';
import { Point, Range, DataPoint, PrecipitationPoint } from './types';
import {
  getScaler,
  getXRangeValues,
  getYRange1Values,
  getYRange2Values,
} from './util';
import { margins } from './constants';
import { GraphTemperature } from './GraphTemperature';
import { GraphPrecipitation } from './GraphPrecipitation';

interface Props {
  datapoints: DataPoint[];
  size: Point;
}

export function WeatherGraph({ datapoints, size }: Props) {
  const scaler = useMemo(() => getScaler(size, margins), [size]);
  const { yRange1, yRange2, xRange, temperature, precipitation } = useMemo((): {
    yRange1: Range;
    yRange2: Range;
    xRange: Range;
    temperature: Point[];
    precipitation: PrecipitationPoint[];
  } => {
    const hours: DataPoint[] = datapoints.slice();
    const temperatureValues: number[] = [];
    const precipitationProbability: number[] = [];
    const times: number[] = [];
    const newTemperature: Point[] = [];
    const newPrecipitation: PrecipitationPoint[] = [];
    hours.forEach((hour) => {
      if (hour && hour.temperature) temperatureValues.push(hour.temperature);
      if (hour && hour.precipProbability)
        precipitationProbability.push(hour.precipProbability);
      if (hour && hour.time) times.push(hour.time);
      if (hour && hour.temperature && hour.time)
        newTemperature.push({ x: hour.time, y: hour.temperature });
      if (hour && hour.time) {
        newPrecipitation.push({
          x: hour.time,
          y: hour.precipProbability ?? 0,
          h: hour.precipIntensity ?? 0,
        });
      }
    });
    return {
      yRange1: getYRange1Values(temperatureValues),
      yRange2: getYRange2Values(precipitationProbability),
      xRange: getXRangeValues(times),
      temperature: newTemperature,
      precipitation: newPrecipitation,
    };
  }, [datapoints]);

  const xPoints = useMemo(
    () =>
      xRange.range.map((rangePoint) => ({
        ...rangePoint,
        pos: scaler.x(
          (rangePoint.value - xRange.min) / (xRange.max - xRange.min),
        ),
      })),
    [scaler, xRange.max, xRange.min, xRange.range],
  );

  const yPoints1 = useMemo(
    () =>
      yRange1.range.map((rangePoint) => ({
        ...rangePoint,
        pos: scaler.y(
          (rangePoint.value - yRange1.min) / (yRange1.max - yRange1.min),
        ),
      })),
    [scaler, yRange1.max, yRange1.min, yRange1.range],
  );

  const yPoints2 = useMemo(
    () =>
      yRange2.range.map((rangePoint) => ({
        ...rangePoint,
        pos: scaler.y(
          (rangePoint.value - yRange2.min) / (yRange2.max - yRange2.min),
        ),
      })),
    [scaler, yRange2.max, yRange2.min, yRange2.range],
  );

  const height = size.y - margins.y * 2;
  const width = size.x - margins.x * 2;

  return (
    <div className="weather-graph">
      <svg width="100%" height="240">
        <g id="yRange1">
          {yPoints1.map((yPoint) => (
            <text
              key={yPoint.value}
              x={margins.x - 5}
              y={yPoint.pos}
              fill="#FF7"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {yPoint.text}
            </text>
          ))}
        </g>
        <g id="yRange2">
          {yPoints2.map((yPoint) => (
            <text
              key={yPoint.value}
              x={size.x - margins.x + 5}
              y={yPoint.pos}
              fill="#ACF"
              textAnchor="start"
              dominantBaseline="middle"
            >
              {yPoint.text}
            </text>
          ))}
        </g>
        <g id="xRange">
          {xPoints.map((xPoint) => (
            <text
              key={xPoint.value}
              x={xPoint.pos}
              y={size.y - margins.y + 10}
              fill="#FFF"
              textAnchor="middle"
              dominantBaseline="hanging"
            >
              {xPoint.text}
            </text>
          ))}
        </g>
        {temperature.length && (
          <GraphTemperature
            xRange={xRange}
            yRange={yRange1}
            data={temperature}
            scaler={scaler}
          />
        )}
        {precipitation.length && (
          <GraphPrecipitation
            xRange={xRange}
            yRange={yRange2}
            data={precipitation}
            scaler={scaler}
          />
        )}
        <path
          d={`
            M ${margins.x} ${margins.y}
            l 0 ${height}
            l ${width} 0
            l 0 -${height}`}
          stroke="#FFF"
          strokeWidth="2"
          fill="transparent"
        />
      </svg>
    </div>
  );
}
