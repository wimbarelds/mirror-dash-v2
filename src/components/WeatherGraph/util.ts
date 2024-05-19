import { colors } from './constants';
import { Point, Range, RangePoint, Scaler } from './types';

export function getScaler(size: Point, margins: Point): Scaler {
  return {
    size,
    margins,
    x: (pct: number) => margins.x + pct * (size.x - margins.x * 2),
    y: (pct: number) => size.y - margins.y - pct * (size.y - margins.y * 2),
  };
}

export const pointToScaled = (
  point: Point,
  xRange: Range,
  yRange: Range,
  scaler: Scaler,
): string => {
  const x = scaler.x((point.x - xRange.min) / (xRange.max - xRange.min));
  const y = scaler.y((point.y - yRange.min) / (yRange.max - yRange.min));
  return `${x} ${y}`;
};

export const getYRange1Values = (values: number[]) => {
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(30, ...values);

  const minRounded = Math.floor(minVal / 10) * 10;
  const maxRounded = Math.ceil(maxVal / 10) * 10;
  const range: RangePoint[] = [];
  for (
    let rangePoint = minRounded;
    rangePoint <= maxRounded;
    rangePoint += 10
  ) {
    range.push({
      value: rangePoint,
      text: rangePoint.toString() + '°',
      pos: 0,
    });
  }

  return {
    min: minRounded,
    max: maxRounded,
    range: range,
  };
};

export const getYRange2Values = (values: number[]) => {
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(100, ...values);

  const range: RangePoint[] = [];
  for (let rangePoint = minVal; rangePoint <= maxVal; rangePoint += 20) {
    range.push({
      value: rangePoint,
      text: Math.floor(rangePoint).toString() + '%',
      pos: 0,
    });
  }

  return {
    min: minVal,
    max: maxVal,
    range: range,
  };
};

export const getXRangeValues = (values: number[]) => {
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const range: RangePoint[] = [];
  for (
    let rangePoint = minVal;
    rangePoint <= maxVal;
    rangePoint += 1000 * 60 * 60
  ) {
    const date = new Date(rangePoint);
    range.push({
      value: rangePoint,
      text: date.getHours().toString() + ':00',
      pos: 0,
    });
  }

  return {
    min: minVal,
    max: maxVal,
    range: range,
  };
};

export const temperatureToColor = (temperature: number): string => {
  if (temperature < -10)
    return temperatureInRangeToColor(0, colors.veryCold, colors.veryCold);
  if (temperature <= 0)
    return temperatureInRangeToColor(
      temperature / -10,
      colors.veryCold,
      colors.cold,
    );
  if (temperature <= 15)
    return temperatureInRangeToColor(
      temperature / 15,
      colors.cold,
      colors.warm,
    );
  if (temperature <= 35)
    return temperatureInRangeToColor(
      (temperature - 15) / 20,
      colors.warm,
      colors.hot,
    );
  return temperatureInRangeToColor(0, colors.hot, colors.hot);
};

const temperatureInRangeToColor = (
  pct: number,
  color0: number[],
  color1: number[],
): string => {
  const c0 = [
    color0[0] * (1 - pct),
    color0[1] * (1 - pct),
    color0[2] * (1 - pct),
  ];
  const c1 = [color1[0] * pct, color1[1] * pct, color1[2] * pct];
  const r = Math.round(c0[0] + c1[0])
    .toString(16)
    .padStart(2, '0');
  const g = Math.round(c0[1] + c1[1])
    .toString(16)
    .padStart(2, '0');
  const b = Math.round(c0[2] + c1[2])
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
};
