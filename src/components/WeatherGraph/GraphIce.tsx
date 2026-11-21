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

/** A warning triangle with an exclamation mark, centred on the given spot */
function WarningIcon({ x, y, solid }: { x: number; y: number; solid: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1.2)`} opacity={solid ? 1 : 0.75} stroke="none">
      {/* The dark outline cuts the line behind the icon */}
      <path
        d="M0 -11L12 9H-12Z"
        fill={ICE_COLOR}
        stroke="black"
        strokeWidth="5"
        strokeLinejoin="round"
        paintOrder="stroke"
      />
      <path d="M0 -4V2" stroke="black" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="0" cy="5.2" r="1.4" fill="black" />
    </g>
  );
}

/**
 * Slippery roads, drawn just below the bottom axis over the hours concerned: a line with a warning
 * sign in the middle. The line is solid and heavy when it is likely, thin and lighter when it is
 * only possible.
 */
export function GraphIce({ points, x }: Props) {
  if (points.length < 2) return null;
  const halfStep = (x(points[1].time) - x(points[0].time)) / 2;
  const y = PLOT.bottom + ICE_OFFSET;

  return (
    <g stroke={ICE_COLOR} strokeLinecap="round">
      {getRuns(points).map(({ first, last, likely }) => {
        const x1 = Math.max(PLOT.left, x(points[first].time) - halfStep + 4);
        const x2 = Math.min(PLOT.right, x(points[last].time) + halfStep - 4);

        return (
          <g key={points[first].time}>
            <line
              x1={x1}
              x2={x2}
              y1={y}
              y2={y}
              strokeWidth={likely ? 6 : 3.5}
              strokeOpacity={likely ? 1 : 0.6}
            />
            <WarningIcon x={(x1 + x2) / 2} y={y} solid={likely} />
          </g>
        );
      })}
    </g>
  );
}
