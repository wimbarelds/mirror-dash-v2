import { colors } from './constants';
import { Point, Scale } from './types';

export const round = (value: number) => Math.round(value * 10) / 10;

export const linearScale =
  (from0: number, from1: number, to0: number, to1: number): Scale =>
  (value) =>
    to0 + ((value - from0) / (from1 - from0)) * (to1 - to0);

/** Vertical limits for a curve, so smoothing can't make it swing past them between two points */
interface Bounds {
  top: number;
  bottom: number;
}

/** One cubic Bézier segment between two neighbouring points */
export interface Cubic {
  from: Point;
  c1: Point;
  c2: Point;
  to: Point;
}

/** The cubic segments of a curve that passes smoothly through every point */
export function smoothCurves(points: Point[], bounds?: Bounds): Cubic[] {
  const limit = (y: number) => (bounds ? Math.min(bounds.bottom, Math.max(bounds.top, y)) : y);

  const curves: Cubic[] = [];
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    const before = points[i - 2] ?? from;
    const after = points[i + 1] ?? to;
    curves.push({
      from,
      c1: { x: from.x + (to.x - before.x) / 6, y: limit(from.y + (to.y - before.y) / 6) },
      c2: { x: to.x - (after.x - from.x) / 6, y: limit(to.y - (after.y - from.y) / 6) },
      to,
    });
  }
  return curves;
}

/** Cubic curve segments (without the starting "M") that pass smoothly through every point */
export function smoothSegments(points: Point[], bounds?: Bounds) {
  return smoothCurves(points, bounds)
    .map(
      ({ c1, c2, to }) =>
        ` C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(to.x)} ${round(to.y)}`,
    )
    .join('');
}

export const smoothPath = (points: Point[], bounds?: Bounds) =>
  `M${round(points[0].x)} ${round(points[0].y)}${smoothSegments(points, bounds)}`;

/** A temperature axis that fits the data, so a mild day doesn't turn into a flat line */
export function getTemperatureAxis(values: number[]) {
  let min = Math.floor(Math.min(...values) - 1);
  let max = Math.ceil(Math.max(...values) + 1);
  if (max - min < 6) {
    min = Math.floor((min + max) / 2 - 3);
    max = min + 6;
  }

  const step = max - min <= 8 ? 2 : max - min <= 20 ? 5 : 10;
  const ticks: number[] = [];
  for (let tick = Math.ceil(min / step) * step; tick <= max; tick += step) ticks.push(tick);

  return { min, max, ticks };
}

const mixColors = (amount: number, from: number[], to: number[]) =>
  '#' +
  [0, 1, 2]
    .map((channel) => Math.round(from[channel] * (1 - amount) + to[channel] * amount))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

export function temperatureToColor(temperature: number) {
  if (temperature <= -10) return mixColors(1, colors.cold, colors.veryCold);
  if (temperature <= 0) return mixColors(temperature / -10, colors.cold, colors.veryCold);
  if (temperature <= 15) return mixColors(temperature / 15, colors.cold, colors.warm);
  if (temperature <= 35) return mixColors((temperature - 15) / 20, colors.warm, colors.hot);
  return mixColors(1, colors.warm, colors.hot);
}
