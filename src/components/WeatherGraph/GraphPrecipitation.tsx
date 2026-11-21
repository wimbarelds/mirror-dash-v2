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

/** Distance between the dots, and their radius, in drawing units */
const SPACING = 14;
const RADIUS = 3.5;

/** Hours with a real chance of precipitation. Tiny probabilities with nothing falling are left out. */
const isRainy = (point: HourPoint) => point.precipProbability >= 10 || point.precipitation >= 0.1;

/**
 * Precipitation as a dotted line. The height follows the chance (read from the right-hand axis) and
 * the colour tells rain (blue) from snow (white). Dots only appear where something is expected.
 */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  const curves = smoothCurves(
    points.map((point) => ({ x: x(point.time), y: chanceY(point.precipProbability) })),
    { top: PLOT.top, bottom: PLOT.bottom },
  );

  return (
    <g>
      {sampleCurves(curves, SPACING).map(({ x: cx, y: cy, segment, t }, index) => {
        const nearest = points[t < 0.5 ? segment : segment + 1];
        if (!isRainy(nearest)) return null;

        return (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill={isSnow(nearest) ? SNOW_COLOR : RAIN_COLOR}
          />
        );
      })}
    </g>
  );
}
