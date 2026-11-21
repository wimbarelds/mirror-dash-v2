import { HourPoint, isSnow } from '../../util/weather/selectors';
import { PLOT } from './constants';
import { useAmountStyle } from './precipitation-amount';
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

/** Anything from this amount (mm per hour) counts as wet */
const WET = 0.1;

const colorOf = (point: HourPoint) => (isSnow(point) ? SNOW_COLOR : RAIN_COLOR);

/** Half the length of the vertical line through an hour's dot: grows with the square root of the amount */
const halfLength = (mm: number) => Math.min(32, 5 + 10 * Math.sqrt(mm));

/**
 * Precipitation as a dotted line. The height follows the chance (read from the right-hand axis) and
 * the colour tells rain (blue) from snow (white). The amount can be shown as a vertical line through
 * the dot of each hour, like an error bar; see AmountStyle. By default it isn't shown.
 */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  const style = useAmountStyle();
  const curves = smoothCurves(
    points.map((point) => ({ x: x(point.time), y: chanceY(point.precipProbability) })),
    { top: PLOT.top, bottom: PLOT.bottom },
  );

  return (
    <g>
      {style !== 'none' &&
        points.map((point) => {
          if (point.precipitation < WET) return null;
          const [cx, cy] = [x(point.time), chanceY(point.precipProbability)];
          const half = halfLength(point.precipitation);
          const [top, bottom] = [cy - half, cy + half];

          return (
            <g key={point.time} stroke={colorOf(point)} strokeWidth="1.5" strokeLinecap="round">
              <line x1={cx} x2={cx} y1={top} y2={bottom} />
              {style === 'caps' && (
                <>
                  <line x1={cx - 4} x2={cx + 4} y1={top} y2={top} />
                  <line x1={cx - 4} x2={cx + 4} y1={bottom} y2={bottom} />
                </>
              )}
            </g>
          );
        })}

      {sampleCurves(curves, SPACING).map(({ x: cx, y: cy, segment, t }, index) => (
        <circle
          key={index}
          cx={cx}
          cy={cy}
          r={RADIUS}
          fill={colorOf(points[t < 0.5 ? segment : segment + 1])}
        />
      ))}
    </g>
  );
}
