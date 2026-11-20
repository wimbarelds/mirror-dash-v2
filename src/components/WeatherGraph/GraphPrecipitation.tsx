import { HourPoint, isSnow } from '../../util/weather/selectors';
import { PLOT, VIEW } from './constants';
import { Point, Scale } from './types';
import { round, smoothPath, smoothSegments } from './util';

interface Props {
  points: HourPoint[];
  x: Scale;
  /** Maps a chance of precipitation (0-100) to a height */
  chanceY: Scale;
}

const RAIN_COLOR = '#8fc3ff';
const SNOW_COLOR = '#ffffff';

/**
 * Thickness of the stroke: a minimum for any hour with a chance of precipitation, growing with the
 * square root of the amount so light rain stays visible, up to a limit. In drawing units.
 */
const MIN_THICKNESS = 12;
const THICKNESS_PER_ROOT_MM = 26;
const MAX_THICKNESS = 68;

/** A softer, wider copy behind the stroke feathers its edges (SVG filters are too heavy for a Pi 3) */
const LAYERS = [
  { scale: 1.45, opacity: 0.3 },
  { scale: 1, opacity: 1 },
];

type Kind = 'rain' | 'snow';
const KINDS: Kind[] = ['rain', 'snow'];

/** Hours with a real chance of precipitation. Tiny probabilities with nothing falling are left out. */
const isRainy = (point: HourPoint) => point.precipProbability >= 10 || point.precipitation >= 0.1;

const getThickness = (point: HourPoint) =>
  isRainy(point)
    ? Math.min(
        MAX_THICKNESS,
        MIN_THICKNESS + THICKNESS_PER_ROOT_MM * Math.sqrt(point.precipitation),
      )
    : 0;

/** How solid the stroke is in an hour: faint when it is only a chance, full once rain is expected */
const getStrength = (point: HourPoint) =>
  isRainy(point) ? 0.35 + 0.65 * Math.min(1, point.precipitation / 0.3) : 0;

const textureId = (kind: Kind) => `precipitation-${kind}-texture`;
const maskId = (kind: Kind) => `precipitation-${kind}-mask`;
const weightId = (kind: Kind) => `precipitation-${kind}-weight`;

/**
 * The motifs the textures are made of, drawn in a space where they have a radius of about 1 and
 * scaled into place. A raindrop is a round body with a slight tip.
 */
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

/** A flake of the given radius; its lines stay `line` wide whatever the radius */
function Flake({
  x,
  y,
  radius,
  line = 1.4,
}: {
  x: number;
  y: number;
  radius: number;
  line?: number;
}) {
  return (
    <path
      d={FLAKE_PATH}
      transform={`translate(${x} ${y}) scale(${radius})`}
      stroke={SNOW_COLOR}
      strokeWidth={line / radius}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

/** Staggered raindrops of a few sizes, slanted as if blown by the wind */
function RainTexture() {
  return (
    <pattern
      id={textureId('rain')}
      width="34"
      height="40"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(12)"
    >
      <rect width="34" height="40" fill={RAIN_COLOR} fillOpacity=".14" />
      <g fill={RAIN_COLOR}>
        <path d={DROP_PATH} transform="translate(8 11) scale(3.4)" opacity=".95" />
        <path d={DROP_PATH} transform="translate(25 19) scale(2.8)" opacity=".8" />
        <path d={DROP_PATH} transform="translate(13 31) scale(3)" opacity=".88" />
        <path d={DROP_PATH} transform="translate(28 6) scale(2)" opacity=".6" />
        <path d={DROP_PATH} transform="translate(30 34) scale(1.6)" opacity=".5" />
      </g>
    </pattern>
  );
}

/** Staggered snowflakes of a few sizes, with specks of snow in between */
function SnowTexture() {
  return (
    <pattern id={textureId('snow')} width="42" height="42" patternUnits="userSpaceOnUse">
      <rect width="42" height="42" fill={SNOW_COLOR} fillOpacity=".12" />
      <Flake x={11} y={11} radius={4.6} />
      <Flake x={31} y={28} radius={3.8} />
      <Flake x={31} y={8} radius={2.6} line={1.1} />
      <g fill={SNOW_COLOR}>
        <circle cx="22" cy="19" r="1.6" opacity=".85" />
        <circle cx="6" cy="30" r="1.4" opacity=".7" />
        <circle cx="20" cy="36" r="2" opacity=".85" />
        <circle cx="38" cy="18" r="1.2" opacity=".65" />
        <circle cx="21" cy="4" r="1.1" opacity=".6" />
        <circle cx="37" cy="39" r="1.5" opacity=".7" />
      </g>
    </pattern>
  );
}

/**
 * Precipitation as one textured stroke, like a brush stroke. It follows the chance of precipitation
 * (read from the right-hand axis), is as thick as the amount expected, and tapers to nothing between
 * spells. The texture tells rain (blue streaks) from snow (white speckle) and blends from one into
 * the other where the weather changes.
 */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  const centre: Point[] = points.map((point) => ({
    x: x(point.time),
    y: chanceY(point.precipProbability),
  }));
  const thickness = points.map(getThickness);

  /** The outline of the stroke, thickened by the given scale */
  const outline = (scale: number) => {
    const upper = centre.map((point, i) => ({
      x: point.x,
      y: point.y - (thickness[i] * scale) / 2,
    }));
    const lower = centre
      .map((point, i) => ({ x: point.x, y: point.y + (thickness[i] * scale) / 2 }))
      .reverse();
    return `${smoothPath(upper)} L${round(lower[0].x)} ${round(lower[0].y)}${smoothSegments(lower)}Z`;
  };

  /** Per hour, how much of the stroke is this kind of precipitation: 0 (none) to 1 (fully) */
  const weight = (kind: Kind, point: HourPoint) =>
    (isSnow(point) ? 'snow' : 'rain') === kind ? getStrength(point) : 0;

  return (
    <g>
      <defs>
        <RainTexture />
        <SnowTexture />
        {KINDS.map((kind) => (
          <linearGradient
            key={kind}
            id={weightId(kind)}
            gradientUnits="userSpaceOnUse"
            x1={PLOT.left}
            x2={PLOT.right}
            y1="0"
            y2="0"
          >
            {points.map((point, i) => (
              <stop
                key={point.time}
                offset={(centre[i].x - PLOT.left) / (PLOT.right - PLOT.left)}
                stopColor={`rgb(${Math.round(weight(kind, point) * 255)} ${Math.round(weight(kind, point) * 255)} ${Math.round(weight(kind, point) * 255)})`}
              />
            ))}
          </linearGradient>
        ))}
        {KINDS.map((kind) => (
          <mask
            key={kind}
            id={maskId(kind)}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={VIEW.width}
            height={VIEW.height}
          >
            <rect
              x="0"
              y="0"
              width={VIEW.width}
              height={VIEW.height}
              fill={`url(#${weightId(kind)})`}
            />
          </mask>
        ))}
      </defs>
      {LAYERS.flatMap(({ scale, opacity }) =>
        KINDS.map((kind) => (
          <path
            key={`${kind}-${scale}`}
            d={outline(scale)}
            fill={`url(#${textureId(kind)})`}
            mask={`url(#${maskId(kind)})`}
            opacity={opacity}
          />
        )),
      )}
    </g>
  );
}
