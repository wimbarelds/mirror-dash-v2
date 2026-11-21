import { HourPoint, isSnow } from '../../util/weather/selectors';
import { PLOT } from './constants';
import { Scale } from './types';
import { pointOnCubic, sampleCurves, smoothCurves } from './util';

interface Props {
  points: HourPoint[];
  x: Scale;
  /** Maps a chance of precipitation (0-100) to a height */
  chanceY: Scale;
}

const RAIN_COLOR = '#8fc3ff';
const SNOW_COLOR = '#ffffff';

/** Distance between the dots, and their radius, in drawing units */
const SPACING = 14;
const RADIUS = 2.6;

/** Distance between the pieces the ribbon is drawn in */
const RIBBON_STEP = 3;
const RIBBON_OPACITY = 0.28;

const colorOf = (point: HourPoint) => (isSnow(point) ? SNOW_COLOR : RAIN_COLOR);

/** The ribbon is never thinner than the dots (plus 10%), and grows with the square root of the amount */
const MAX_RIBBON = 48;
const ribbonWidth = (mm: number) => Math.min(MAX_RIBBON, RADIUS * 2 * 1.1 + 20 * Math.sqrt(mm));

/**
 * Precipitation as a dotted line. The height follows the chance (read from the right-hand axis) and
 * the colour tells rain (blue) from snow (white). Behind it runs a see-through ribbon whose thickness
 * is the amount expected.
 */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  const curves = smoothCurves(
    points.map((point) => ({ x: x(point.time), y: chanceY(point.precipProbability) })),
    { top: PLOT.top, bottom: PLOT.bottom },
  );

  // Amounts are averaged with the hours around them, as hour-to-hour jumps make the ribbon lumpy
  const amounts = points.map((point, i) => {
    const [before, after] = [
      points[Math.max(0, i - 1)],
      points[Math.min(points.length - 1, i + 1)],
    ];
    return (before.precipitation + 2 * point.precipitation + after.precipitation) / 4;
  });

  // The thickness follows its own smooth curve through the hourly values, so it changes gradually
  const widthCurves = smoothCurves(
    points.map((point, i) => ({ x: x(point.time), y: ribbonWidth(amounts[i]) })),
    { top: 0, bottom: MAX_RIBBON },
  );
  const widthAt = (segment: number, t: number) => pointOnCubic(widthCurves[segment], t).y;
  /** Where the chance is 0% the line lies on the axis, and nothing is drawn */
  const isDry = (y: number) => y > PLOT.bottom - 0.5;
  const nearest = (segment: number, t: number) => points[t < 0.5 ? segment : segment + 1];

  return (
    <g>
      {
        // Overlapping round-ended pieces of different thickness make one stroke whose thickness
        // varies. They are opaque, and the group as a whole is see-through, so overlaps don't show.
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
      }

      {sampleCurves(curves, SPACING).map(({ x: cx, y: cy, segment, t }, index) =>
        isDry(cy) ? null : (
          <circle key={index} cx={cx} cy={cy} r={RADIUS} fill={colorOf(nearest(segment, t))} />
        ),
      )}
    </g>
  );
}
