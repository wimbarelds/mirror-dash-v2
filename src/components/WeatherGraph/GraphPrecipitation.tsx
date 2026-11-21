import { HourPoint, isSnow } from '../../util/weather/selectors';
import { PLOT } from './constants';
import { Scale } from './types';
import { pointOnCubic, sampleCurves, smoothCurves } from './util';

interface Props {
  points: HourPoint[];
  x: Scale;
  chanceY: Scale;
}

const RAIN_COLOR = '#8fc3ff';
const SNOW_COLOR = '#ffffff';

/** Dot spacing and radius */
const SPACING = 14;
const RADIUS = 2.6;

/** The ribbon is drawn in short pieces of varying thickness */
const RIBBON_STEP = 3;
const RIBBON_OPACITY = 0.28;

const colorOf = (point: HourPoint) => (isSnow(point) ? SNOW_COLOR : RAIN_COLOR);

/** At least as thick as the dots (+10%), growing with the square root of the amount */
const MAX_RIBBON = 48;
const ribbonWidth = (mm: number) => Math.min(MAX_RIBBON, RADIUS * 2 * 1.1 + 20 * Math.sqrt(mm));

/** A dotted line for the chance of precipitation, on a ribbon as thick as the amount */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  const curves = smoothCurves(
    points.map((point) => ({ x: x(point.time), y: chanceY(point.precipProbability) })),
    { top: PLOT.top, bottom: PLOT.bottom },
  );

  // Averaged with neighbouring hours, so the ribbon is not lumpy
  const amounts = points.map((point, i) => {
    const [before, after] = [
      points[Math.max(0, i - 1)],
      points[Math.min(points.length - 1, i + 1)],
    ];
    return (before.precipitation + 2 * point.precipitation + after.precipitation) / 4;
  });

  const widthCurves = smoothCurves(
    points.map((point, i) => ({ x: x(point.time), y: ribbonWidth(amounts[i]) })),
    { top: 0, bottom: MAX_RIBBON },
  );
  const widthAt = (segment: number, t: number) => pointOnCubic(widthCurves[segment], t).y;

  // At 0% the line lies on the axis; draw nothing there
  const isDry = (y: number) => y > PLOT.bottom - 0.5;
  const nearest = (segment: number, t: number) => points[t < 0.5 ? segment : segment + 1];

  return (
    <g>
      {/* Opaque overlapping pieces, made see-through together so the overlaps don't show */}
      <g opacity={RIBBON_OPACITY} strokeLinecap="round">
        {sampleCurves(curves, RIBBON_STEP).map(({ x: cx, y: cy, segment, t }, index, all) => {
          const next = all[index + 1];
          if (!next || (isDry(cy) && isDry(next.y))) return null;
          return (
            <line
              key={index}
              x1={cx}
              y1={cy}
              x2={next.x}
              y2={next.y}
              stroke={colorOf(nearest(segment, t))}
              strokeWidth={widthAt(segment, t)}
            />
          );
        })}
      </g>

      {sampleCurves(curves, SPACING).map(({ x: cx, y: cy, segment, t }, index) =>
        isDry(cy) ? null : (
          <circle key={index} cx={cx} cy={cy} r={RADIUS} fill={colorOf(nearest(segment, t))} />
        ),
      )}
    </g>
  );
}
