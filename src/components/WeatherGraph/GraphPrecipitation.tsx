import { useMemo } from 'react';
import { Point, PrecipitationPoint, Range, Scaler } from './types';

const rangeCap = (y: number, yRange: Range, scaler: Scaler) => {
  const minY = scaler.y(yRange.min);
  if (y > minY) return minY;

  const maxY = scaler.y(yRange.max);
  if (y < maxY) return maxY;

  return y;
};

export function GraphPrecipitation({
  xRange,
  yRange,
  data,
  scaler,
}: {
  xRange: Range;
  yRange: Range;
  data: PrecipitationPoint[];
  scaler: Scaler;
}) {
  const curveStrength = 0.33;
  const precipitationChance = useMemo(() => {
    const points: Point[] = [];
    if (xRange && yRange) {
      for (let i = 0; i < data.length; i++) {
        const value: PrecipitationPoint = data[i];
        const x: number = scaler.x(
          (value.x - xRange.min) / (xRange.max - xRange.min),
        );
        const y: number = scaler.y(
          (value.y - yRange.min) / (yRange.max - yRange.min),
        );
        points.push({ x: x, y: y });
      }
    }

    let string = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const from = points[i - 1];
      const to = points[i];
      const before = i === 1 ? points[0] : points[i - 2];
      const after = i + 1 === points.length ? points[i] : points[i + 1];

      const deltaFrom: number = (to.y - before.y) * curveStrength;
      const deltaTo: number = (after.y - from.y) * curveStrength;

      const px0: number = from.x * (1 - curveStrength) + to.x * curveStrength;
      const px1: number = from.x * curveStrength + to.x * (1 - curveStrength);
      const py0: number = rangeCap(from.y + deltaFrom, yRange, scaler);
      const py1: number = rangeCap(to.y - deltaTo, yRange, scaler);

      string += ` C ${px0} ${py0} ${px1} ${py1} ${to.x} ${to.y}`;
    }

    return string;
  }, [data, xRange, yRange, scaler]);

  const precipitationIntensity = useMemo(() => {
    const top: Point[] = [];
    const bottom: Point[] = [];

    if (xRange && yRange) {
      for (let i = 0; i < data.length; i++) {
        const value: PrecipitationPoint = data[i];
        const h: number = Math.round(value.h * 20);
        const x: number = scaler.x(
          (value.x - xRange.min) / (xRange.max - xRange.min),
        );
        const yBottom: number =
          scaler.y((value.y - yRange.min) / (yRange.max - yRange.min)) - h / 2;
        const yTop: number = yBottom + h;
        top.push({ x: x, y: yTop });
        bottom.push({ x: x, y: yBottom });
      }
    }

    bottom.reverse();

    let string = `M ${top[0].x} ${top[0].y}`;
    for (let i = 1; i < top.length; i++) {
      const from = top[i - 1];
      const to = top[i];
      const before = i === 1 ? top[0] : top[i - 2];
      const after = i + 1 === top.length ? top[i] : top[i + 1];

      const deltaFrom: number = (to.y - before.y) * curveStrength;
      const deltaTo: number = (after.y - from.y) * curveStrength;

      const ph0: number = from.x * (1 - curveStrength) + to.x * curveStrength;
      const ph1: number = from.x * curveStrength + to.x * (1 - curveStrength);

      string += ` C ${ph0} ${from.y + deltaFrom} ${ph1} ${to.y - deltaTo} ${to.x} ${to.y}`;
    }
    for (let i = 1; i < bottom.length; i++) {
      const from = bottom[i - 1];
      const to = bottom[i];
      const before = i === 1 ? bottom[0] : bottom[i - 2];
      const after = i + 1 === bottom.length ? bottom[i] : bottom[i + 1];

      const deltaFrom: number = (to.y - before.y) * curveStrength;
      const deltaTo: number = (after.y - from.y) * curveStrength;

      const ph0: number = from.x * (1 - curveStrength) + to.x * curveStrength;
      const ph1: number = from.x * curveStrength + to.x * (1 - curveStrength);

      string += ` C ${ph0} ${from.y + deltaFrom} ${ph1} ${to.y - deltaTo} ${to.x} ${to.y}`;
    }

    return string;
  }, [data, scaler, xRange, yRange]);

  return (
    <g id="Precipitation">
      <path
        d={precipitationChance}
        stroke="#369"
        strokeWidth="2"
        fill="transparent"
      />
      <path d={precipitationIntensity} fill="rgba(51, 102, 153, 0.5)" />
    </g>
  );
}
