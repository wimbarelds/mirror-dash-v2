import { HourPoint, isSnow } from '../../util/weather/selectors';
import { Point, Scale } from './types';
import { round, smoothPath, smoothSegments } from './util';

interface Props {
  points: HourPoint[];
  x: Scale;
  /** Maps a chance of precipitation (0-100) to a height */
  chanceY: Scale;
}

/** How thick the ribbon gets per mm in an hour, and its limit, in drawing units */
const THICKNESS_PER_MM = 28;
const MAX_THICKNESS = 70;

type Kind = 'rain' | 'snow';

/** Rain is solid blue. Snow is white with a dotted line, so the two can't be mistaken for each other. */
const STYLES: Record<Kind, { color: string; fillOpacity: number; dash?: string }> = {
  rain: { color: '#8fc3ff', fillOpacity: 0.38 },
  snow: { color: '#ffffff', fillOpacity: 0.3, dash: '1 9' },
};

/** Hours with a real chance of precipitation. Tiny probabilities with nothing falling are left out. */
const isRainy = (point: HourPoint) => point.precipProbability >= 10 || point.precipitation >= 0.1;

const getKind = (point: HourPoint): Kind => (isSnow(point) ? 'snow' : 'rain');

/** Stretches of consecutive hours of the same kind of precipitation, as indexes into the points */
function getRuns(points: HourPoint[]) {
  const runs: { kind: Kind; first: number; last: number }[] = [];

  let i = 0;
  while (i < points.length) {
    if (!isRainy(points[i])) {
      i++;
      continue;
    }
    const kind = getKind(points[i]);
    const first = i;
    while (i < points.length && isRainy(points[i]) && getKind(points[i]) === kind) i++;
    runs.push({ kind, first, last: i - 1 });
  }

  return runs;
}

/**
 * Precipitation in one shape: the line follows the chance (read from the right-hand axis), and the
 * ribbon around it is as thick as the amount expected in that hour. Each run tapers off into the
 * dry hour on both sides.
 */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  return (
    <g>
      {getRuns(points).map(({ kind, first, last }) => {
        const line: Point[] = [];
        const upper: Point[] = [];
        const lower: Point[] = [];

        for (let i = Math.max(0, first - 1); i <= Math.min(points.length - 1, last + 1); i++) {
          const point = points[i];
          const inside = i >= first && i <= last;
          const y = chanceY(inside ? point.precipProbability : 0);
          const half = inside
            ? Math.min(point.precipitation * THICKNESS_PER_MM, MAX_THICKNESS) / 2
            : 0;
          line.push({ x: x(point.time), y });
          upper.push({ x: x(point.time), y: y - half });
          lower.unshift({ x: x(point.time), y: y + half });
        }

        const { color, fillOpacity, dash } = STYLES[kind];
        const ribbon = `${smoothPath(upper)} L${round(lower[0].x)} ${round(lower[0].y)}${smoothSegments(lower)}Z`;

        return (
          <g key={points[first].time}>
            <path d={ribbon} fill={color} fillOpacity={fillOpacity} />
            <path
              d={smoothPath(line)}
              fill="none"
              stroke={color}
              strokeWidth={dash ? 4 : 3}
              strokeDasharray={dash}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
}
