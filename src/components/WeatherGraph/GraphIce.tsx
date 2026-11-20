import { HourPoint } from '../../util/weather/selectors';
import { PLOT } from './constants';
import { Scale } from './types';

interface Props {
  points: HourPoint[];
  x: Scale;
}

/** Shades the hours with a risk of slippery roads as a band behind everything else */
export function GraphIce({ points, x }: Props) {
  if (points.length < 2) return null;
  const halfStep = (x(points[1].time) - x(points[0].time)) / 2;

  return (
    <g fill="#7fe3ff">
      {points.map(
        (point) =>
          point.ice !== 'none' && (
            <rect
              key={point.time}
              x={x(point.time) - halfStep - 0.5}
              y={PLOT.top}
              width={halfStep * 2 + 1}
              height={PLOT.bottom - PLOT.top}
              fillOpacity={point.ice === 'likely' ? 0.22 : 0.1}
            />
          ),
      )}
    </g>
  );
}
