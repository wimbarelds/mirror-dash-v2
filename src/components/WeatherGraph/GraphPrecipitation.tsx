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
const MIN_THICKNESS = 7;
const THICKNESS_PER_ROOT_MM = 24;
const MAX_THICKNESS = 64;

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

/** Slanted streaks of rain */
function RainTexture() {
  return (
    <pattern
      id={textureId('rain')}
      width="26"
      height="32"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(14)"
    >
      <rect width="26" height="32" fill={RAIN_COLOR} fillOpacity=".16" />
      <g stroke={RAIN_COLOR} strokeLinecap="round" fill="none">
        <path d="M3 3V15" strokeWidth="1.6" opacity=".9" />
        <path d="M12 12V30" strokeWidth="1.2" opacity=".7" />
        <path d="M20 1V10" strokeWidth="1.8" opacity=".95" />
        <path d="M7 21V29" strokeWidth="1.2" opacity=".6" />
        <path d="M22 17V27" strokeWidth="1.4" opacity=".8" />
      </g>
    </pattern>
  );
}

/** Speckles and a few tiny flakes of snow */
function SnowTexture() {
  return (
    <pattern id={textureId('snow')} width="34" height="34" patternUnits="userSpaceOnUse">
      <rect width="34" height="34" fill={SNOW_COLOR} fillOpacity=".12" />
      <g fill={SNOW_COLOR}>
        <circle cx="5" cy="6" r="1.6" opacity=".9" />
        <circle cx="17" cy="4" r="1" opacity=".7" />
        <circle cx="28" cy="9" r="2" opacity=".85" />
        <circle cx="10" cy="19" r="2.2" opacity=".9" />
        <circle cx="23" cy="22" r="1.4" opacity=".75" />
        <circle cx="31" cy="30" r="1" opacity=".6" />
        <circle cx="4" cy="29" r="1.2" opacity=".7" />
        <circle cx="16" cy="31" r="1.8" opacity=".85" />
        <circle cx="26" cy="15" r=".9" opacity=".6" />
      </g>
      <g stroke={SNOW_COLOR} strokeWidth="1" strokeLinecap="round" fill="none" opacity=".9">
        <path d="M12 8h5M14.5 5.8v4.4M13.1 6.4l2.8 3.2M15.9 6.4l-2.8 3.2" />
        <path d="M24 26h5M26.5 23.8v4.4M25.1 24.4l2.8 3.2M27.9 24.4l-2.8 3.2" />
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
