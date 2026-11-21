import { HourPoint } from '../../util/weather/selectors';
import { PLOT } from './constants';
import { Scale } from './types';

interface Props {
  points: HourPoint[];
  x: Scale;
}

const ICE_COLOR = '#7fe3ff';

/** The line sits just below the axis, so it does not cover it */
const ICE_OFFSET = 8;

/** Stretches of consecutive hours with a risk of slippery roads, as indexes into the points */
function getRuns(points: HourPoint[]) {
  const runs: { first: number; last: number; likely: boolean }[] = [];

  let i = 0;
  while (i < points.length) {
    if (points[i].ice === 'none') {
      i++;
      continue;
    }
    const first = i;
    let likely = false;
    while (i < points.length && points[i].ice !== 'none') {
      if (points[i].ice === 'likely') likely = true;
      i++;
    }
    runs.push({ first, last: i - 1, likely });
  }

  return runs;
}

/**
 * Slippery roads, drawn as a thick line just below the bottom axis over the hours concerned: solid and
 * heavy when it is likely, thin and lighter when it is only possible.
 */
export function GraphIce({ points, x }: Props) {
  if (points.length < 2) return null;
  const halfStep = (x(points[1].time) - x(points[0].time)) / 2;

  return (
    <g stroke={ICE_COLOR} strokeLinecap="round">
      {getRuns(points).map(({ first, last, likely }) => (
        <line
          key={points[first].time}
          x1={Math.max(PLOT.left, x(points[first].time) - halfStep + 4)}
          x2={Math.min(PLOT.right, x(points[last].time) + halfStep - 4)}
          y1={PLOT.bottom + ICE_OFFSET}
          y2={PLOT.bottom + ICE_OFFSET}
          strokeWidth={likely ? 6 : 3.5}
          strokeOpacity={likely ? 1 : 0.6}
        />
      ))}
    </g>
  );
}
