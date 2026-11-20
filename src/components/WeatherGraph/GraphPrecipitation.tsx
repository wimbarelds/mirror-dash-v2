import { HourPoint, isSnow } from '../../util/weather/selectors';
import { PLOT } from './constants';
import { Scale } from './types';
import { sampleCurves, smoothCurves } from './util';

interface Props {
  points: HourPoint[];
  x: Scale;
  /** Maps a chance of precipitation (0-100) to a height */
  chanceY: Scale;
}

const RAIN_COLOR = '#8fc3ff';
const SNOW_COLOR = '#ffffff';

/** Distance between the dots, in drawing units */
const SPACING = 14;

/** Dot radius grows with the square root of the amount, so light rain stays visible, up to a limit */
const MIN_RADIUS = 1.8;
const RADIUS_PER_ROOT_MM = 4.5;
const MAX_RADIUS = 9;

/** Hours with a real chance of precipitation. Tiny probabilities with nothing falling are left out. */
const isRainy = (point: HourPoint) => point.precipProbability >= 10 || point.precipitation >= 0.1;

/** The amount (mm) that decides the dot size; 0 where nothing is expected, so no dots are drawn */
const getAmount = (point: HourPoint) => (isRainy(point) ? Math.max(point.precipitation, 0.05) : 0);

/**
 * Precipitation as a dotted line. The height follows the chance (read from the right-hand axis),
 * the size of the dots is the amount expected, and the colour tells rain (blue) from snow (white).
 * Dots only appear where something is expected, and shrink away at the edges of a spell.
 */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  const curves = smoothCurves(
    points.map((point) => ({ x: x(point.time), y: chanceY(point.precipProbability) })),
    { top: PLOT.top, bottom: PLOT.bottom },
  );
  const amounts = points.map(getAmount);

  return (
    <g>
      {sampleCurves(curves, SPACING).map(({ x: cx, y: cy, segment, t }, index) => {
        const amount = amounts[segment] + (amounts[segment + 1] - amounts[segment]) * t;
        if (amount <= 0) return null;

        const nearest = points[t < 0.5 ? segment : segment + 1];
        return (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r={Math.min(MAX_RADIUS, MIN_RADIUS + RADIUS_PER_ROOT_MM * Math.sqrt(amount))}
            fill={isSnow(nearest) ? SNOW_COLOR : RAIN_COLOR}
            fillOpacity={Math.min(1, amount / 0.15)}
          />
        );
      })}
    </g>
  );
}
