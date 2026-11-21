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

/** Distance between the dots, and their radius when it doesn't show the amount, in drawing units */
const SPACING = 14;
const RADIUS = 3.5;

/** Anything from this amount (mm per hour) counts as wet */
const WET = 0.1;

const colorOf = (point: HourPoint) => (isSnow(point) ? SNOW_COLOR : RAIN_COLOR);

/** Dot radius growing with the square root of the amount, so light rain stays visible */
const sizeRadius = (mm: number) => Math.min(9, 2.5 + 4 * Math.sqrt(mm));

/** Dot radius in three steps: light, moderate and heavy */
const stepRadius = (mm: number) => (mm < 0.5 ? 2.5 : mm < 2 ? 4.5 : 7);

/** Bars along the bottom, one per hour: how tall the bar for this amount is */
const barHeight = (mm: number) => Math.min(80, 24 * Math.sqrt(mm));

const formatMm = (mm: number) => `${mm < 10 ? mm.toFixed(1).replace('.', ',') : Math.round(mm)} mm`;

/** The hour with the most precipitation of every spell of wet hours */
function spellPeaks(points: HourPoint[]) {
  const peaks: HourPoint[] = [];
  let peak: HourPoint | undefined;
  for (const point of [...points, undefined]) {
    if (point && point.precipitation >= WET) {
      if (!peak || point.precipitation > peak.precipitation) peak = point;
    } else if (peak) {
      peaks.push(peak);
      peak = undefined;
    }
  }
  return peaks;
}

/**
 * Precipitation as a dotted line. The height follows the chance (read from the right-hand axis) and
 * the colour tells rain (blue) from snow (white). The amount can be shown in a few ways, see
 * AmountStyle; by default it isn't.
 */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  const style = useAmountStyle();
  const curves = smoothCurves(
    points.map((point) => ({ x: x(point.time), y: chanceY(point.precipProbability) })),
    { top: PLOT.top, bottom: PLOT.bottom },
  );
  const barWidth = ((PLOT.right - PLOT.left) / Math.max(1, points.length - 1)) * 0.55;

  return (
    <g>
      {style === 'bars' &&
        points.map(
          (point) =>
            point.precipitation >= WET && (
              <rect
                key={point.time}
                x={x(point.time) - barWidth / 2}
                y={PLOT.bottom - 6 - barHeight(point.precipitation)}
                width={barWidth}
                height={barHeight(point.precipitation)}
                rx="3"
                fill={colorOf(point)}
                fillOpacity=".4"
              />
            ),
        )}

      {sampleCurves(curves, SPACING).map(({ x: cx, y: cy, segment, t }, index) => {
        const nearest = points[t < 0.5 ? segment : segment + 1];
        const mm =
          points[segment].precipitation +
          (points[segment + 1].precipitation - points[segment].precipitation) * t;

        let r = RADIUS;
        if (style === 'size') r = sizeRadius(mm);
        if (style === 'steps') r = stepRadius(mm);

        return <circle key={index} cx={cx} cy={cy} r={r} fill={colorOf(nearest)} />;
      })}

      {style === 'labels' &&
        spellPeaks(points).map((point) => (
          <text
            key={point.time}
            x={x(point.time)}
            y={Math.max(PLOT.top + 18, chanceY(point.precipProbability) - 16)}
            fontSize="20"
            textAnchor="middle"
            fill={colorOf(point)}
          >
            {formatMm(point.precipitation)}
          </text>
        ))}
    </g>
  );
}
