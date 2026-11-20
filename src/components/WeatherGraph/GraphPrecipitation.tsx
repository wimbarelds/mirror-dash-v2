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

/** Distance between the symbols, in drawing units */
const SPACING = 14;

/** Symbol size grows with the square root of the amount, so light rain stays visible, up to a limit */
const MIN_RADIUS = 1.8;
const RADIUS_PER_ROOT_MM = 4.5;
const MAX_RADIUS = 9;

/** The symbols are drawn in a space where they have a radius of about 1; these scale them to fit */
const DROP_SCALE = 0.9;
const FLAKE_SCALE = 1.2;

const DROP_ID = 'precipitation-drop';
const FLAKE_ID = 'precipitation-flake';

/** A raindrop: a round body with a slight tip */
const DROP_PATH = 'M0 -1.35 C0.3 -0.75 1 -0.2 1 0.4 A1 1 0 0 1 -1 0.4 C-1 -0.2 -0.3 -0.75 0 -1.35Z';

/** A snowflake: three arms crossing at 60 degrees, each with a small chevron near the tip */
const FLAKE_ARM: [number, number][][] = [
  [
    [0, -1],
    [0, 1],
  ],
  [
    [-0.3, -0.62],
    [0, -0.92],
    [0.3, -0.62],
  ],
  [
    [-0.3, 0.62],
    [0, 0.92],
    [0.3, 0.62],
  ],
];

const FLAKE_PATH = [0, 60, 120]
  .flatMap((degrees) => {
    const angle = (degrees * Math.PI) / 180;
    return FLAKE_ARM.map((line) =>
      line
        .map(([px, py], i) => {
          const rx = px * Math.cos(angle) - py * Math.sin(angle);
          const ry = px * Math.sin(angle) + py * Math.cos(angle);
          return `${i === 0 ? 'M' : 'L'}${rx.toFixed(3)} ${ry.toFixed(3)}`;
        })
        .join(''),
    );
  })
  .join('');

/** Hours with a real chance of precipitation. Tiny probabilities with nothing falling are left out. */
const isRainy = (point: HourPoint) => point.precipProbability >= 10 || point.precipitation >= 0.1;

/** The amount (mm) that decides the symbol size; 0 where nothing is expected, so none is drawn */
const getAmount = (point: HourPoint) => (isRainy(point) ? Math.max(point.precipitation, 0.05) : 0);

/**
 * Precipitation as a line of symbols: raindrops (blue) for rain and snowflakes (white) for snow. The
 * height follows the chance (read from the right-hand axis) and the size is the amount expected.
 * Symbols only appear where something is expected, and shrink away at the edges of a spell.
 */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  const curves = smoothCurves(
    points.map((point) => ({ x: x(point.time), y: chanceY(point.precipProbability) })),
    { top: PLOT.top, bottom: PLOT.bottom },
  );
  const amounts = points.map(getAmount);

  return (
    <g>
      <defs>
        <path id={DROP_ID} d={DROP_PATH} />
        <path
          id={FLAKE_ID}
          d={FLAKE_PATH}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </defs>
      {sampleCurves(curves, SPACING).map(({ x: cx, y: cy, segment, t }, index) => {
        const amount = amounts[segment] + (amounts[segment + 1] - amounts[segment]) * t;
        if (amount <= 0) return null;

        const radius = Math.min(MAX_RADIUS, MIN_RADIUS + RADIUS_PER_ROOT_MM * Math.sqrt(amount));
        const opacity = Math.min(1, amount / 0.15);
        const snow = isSnow(points[t < 0.5 ? segment : segment + 1]);
        const scale = radius * (snow ? FLAKE_SCALE : DROP_SCALE);
        const transform = `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${scale.toFixed(2)})`;

        return snow ? (
          <use
            key={index}
            href={`#${FLAKE_ID}`}
            transform={transform}
            stroke={SNOW_COLOR}
            // Kept at least 1.3 units wide on screen, however small the flake
            strokeWidth={Math.max(0.2, 1.3 / scale)}
            opacity={opacity}
          />
        ) : (
          <use
            key={index}
            href={`#${DROP_ID}`}
            transform={transform}
            fill={RAIN_COLOR}
            opacity={opacity}
          />
        );
      })}
    </g>
  );
}
