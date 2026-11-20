import { HourPoint } from '../../util/weather/selectors';
import { Point, Scale } from './types';
import { round, smoothPath, smoothSegments } from './util';

interface Props {
  points: HourPoint[];
  x: Scale;
  /** Maps a chance of rain (0-100) to a height */
  chanceY: Scale;
}

/** How thick the ribbon gets per mm of rain in an hour, and its limit, in drawing units */
const THICKNESS_PER_MM = 28;
const MAX_THICKNESS = 70;

/** Hours with a real chance of rain. Tiny probabilities with no rain are left out as noise. */
const isRainy = (point: HourPoint) => point.precipProbability >= 10 || point.precipitation >= 0.1;

/** Stretches of consecutive rainy hours, each with one dry hour on both sides to taper off into */
function getRuns(points: HourPoint[]) {
  const runs: HourPoint[][] = [];
  let start = -1;

  points.forEach((point, index) => {
    if (isRainy(point)) {
      if (start === -1) start = index;
    } else if (start !== -1) {
      runs.push(points.slice(Math.max(0, start - 1), index + 1));
      start = -1;
    }
  });
  if (start !== -1) runs.push(points.slice(Math.max(0, start - 1)));

  return runs;
}

/**
 * Rain in one shape: the line follows the chance of rain (read from the right-hand axis), and the
 * ribbon around it is as thick as the amount of rain expected in that hour.
 */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  return (
    <g>
      {getRuns(points).map((run) => {
        const line: Point[] = [];
        const upper: Point[] = [];
        const lower: Point[] = [];

        for (const point of run) {
          const rainy = isRainy(point);
          const y = chanceY(rainy ? point.precipProbability : 0);
          const half = rainy
            ? Math.min(point.precipitation * THICKNESS_PER_MM, MAX_THICKNESS) / 2
            : 0;
          line.push({ x: x(point.time), y });
          upper.push({ x: x(point.time), y: y - half });
          lower.unshift({ x: x(point.time), y: y + half });
        }

        const ribbon = `${smoothPath(upper)} L${round(lower[0].x)} ${round(lower[0].y)}${smoothSegments(lower)}Z`;

        return (
          <g key={run[0].time}>
            <path d={ribbon} fill="#8fc3ff" fillOpacity=".38" />
            <path d={smoothPath(line)} fill="none" stroke="#8fc3ff" strokeWidth="3" />
          </g>
        );
      })}
    </g>
  );
}
