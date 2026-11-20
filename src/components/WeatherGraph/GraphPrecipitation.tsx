import { ReactNode } from 'react';

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

/** A small seeded random number generator: the textures look random, but are always the same */
function createRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Each texture covers the whole plot in one piece, so nothing repeats within the graph. They are made
 * once when the page loads, as the same elements every time, so redrawing the graph costs nothing.
 */
const TEXTURE = {
  x: PLOT.left,
  y: PLOT.top - 8,
  width: PLOT.right - PLOT.left,
  height: PLOT.bottom - PLOT.top + 8,
};

/**
 * Motifs are placed one per cell of a grid, moved a little off its centre (by up to this fraction of
 * a cell) and given a random size and angle. Pure randomness leaves bare patches and clumps, which
 * read as holes in the stroke; this looks irregular but can't leave a gap bigger than about a cell.
 */
const JITTER = 0.7;

function scatter(
  seed: number,
  cell: number,
  place: (random: () => number, x: number, y: number, col: number, row: number) => void,
) {
  const random = createRandom(seed);
  const cols = Math.ceil(TEXTURE.width / cell);
  const rows = Math.ceil(TEXTURE.height / cell);

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const x = (col + 0.5 + (random() - 0.5) * JITTER) * cell;
      const y = (row + 0.5 + (random() - 0.5) * JITTER) * cell;
      place(random, x, y, col, row);
    }
  }
}

/** A raindrop: a round body with a slight tip. Positions are in a space where the body has radius 1. */
const DROP: { control: [number, number][] } = {
  control: [
    [0, -1.35], // tip
    [0.3, -0.75],
    [1, -0.2],
    [1, 0.4], // right of the body
    [-1, 0.4], // left of the body (reached by an arc)
    [-1, -0.2],
    [-0.3, -0.75],
  ],
};

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

/** Moves, scales and turns a point of a motif into its place in the texture */
function placer(x: number, y: number, scale: number, degrees: number) {
  const angle = (degrees * Math.PI) / 180;
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  return ([px, py]: [number, number]) =>
    `${(x + scale * (px * cos - py * sin)).toFixed(1)} ${(y + scale * (px * sin + py * cos)).toFixed(1)}`;
}

/** Path data for a raindrop of the given size, leaning by `degrees` */
function dropPath(x: number, y: number, scale: number, degrees: number) {
  const p = placer(x, y, scale, degrees);
  const [tip, c1, c2, right, left, c3, c4] = DROP.control;
  const r = scale.toFixed(2);
  return `M${p(tip)}C${p(c1)} ${p(c2)} ${p(right)}A${r} ${r} 0 0 1 ${p(left)}C${p(c3)} ${p(c4)} ${p(tip)}Z`;
}

/** Path data for a snowflake of the given radius, turned by `degrees` */
function flakePath(x: number, y: number, radius: number, degrees: number) {
  return [0, 60, 120]
    .flatMap((arm) => {
      const p = placer(x, y, radius, degrees + arm);
      return FLAKE_ARM.map((line) =>
        line.map((point, i) => `${i === 0 ? 'M' : 'L'}${p(point)}`).join(''),
      );
    })
    .join('');
}

/** A circle as path data, so specks can be part of the same path as everything else */
const speckPath = (x: number, y: number, r: number) =>
  `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`;

/**
 * Collects the motifs of a texture as path data, sorted at random into a few opacity steps. Thousands
 * of motifs end up as only a handful of elements, which keeps the graph light to draw.
 */
const OPACITY_STEPS = [0.55, 0.7, 0.85, 1];

function createLayers() {
  const data = OPACITY_STEPS.map(() => '');
  return {
    add(random: () => number, d: string) {
      data[Math.floor(random() * OPACITY_STEPS.length)] += d;
    },
    render(props: { fill?: string; stroke?: string; strokeWidth?: number }, keyPrefix: string) {
      return data.map(
        (d, i) =>
          d && (
            <path
              key={`${keyPrefix}-${i}`}
              d={d}
              opacity={OPACITY_STEPS[i]}
              fill={props.fill ?? 'none'}
              stroke={props.stroke}
              strokeWidth={props.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ),
      );
    },
  };
}

/** One raindrop per cell: different sizes, all leaning a little as if blown by the wind */
function buildRainTexture(): ReactNode {
  const drops = createLayers();
  scatter(7, 15, (random, x, y) => {
    const degrees = 6 + random() * 14;
    const scale = 1.7 + random() * 1.9;
    drops.add(random, dropPath(x, y, scale, degrees));
  });

  return (
    <pattern
      id={textureId('rain')}
      x={TEXTURE.x}
      y={TEXTURE.y}
      width={TEXTURE.width}
      height={TEXTURE.height}
      patternUnits="userSpaceOnUse"
    >
      <rect width={TEXTURE.width} height={TEXTURE.height} fill={RAIN_COLOR} fillOpacity=".14" />
      {drops.render({ fill: RAIN_COLOR }, 'drops')}
    </pattern>
  );
}

/**
 * Snowflakes and specks, one per small cell. In every block of 2x2 cells exactly one is a snowflake,
 * chosen at random, so flakes are spread evenly as well and the stroke is dense without being uniform.
 */
function buildSnowTexture(): ReactNode {
  const flakes = createLayers();
  const specks = createLayers();
  const flakeInBlock = new Map<string, number>();

  scatter(11, 12, (random, x, y, col, row) => {
    const block = `${col >> 1}-${row >> 1}`;
    if (!flakeInBlock.has(block)) flakeInBlock.set(block, Math.floor(random() * 4));
    const isFlake = flakeInBlock.get(block) === (col & 1) + 2 * (row & 1);

    if (isFlake) {
      flakes.add(random, flakePath(x, y, 2.6 + random() * 2.4, random() * 60));
    } else {
      specks.add(random, speckPath(x, y, 0.9 + random() * 1.3));
    }
  });

  return (
    <pattern
      id={textureId('snow')}
      x={TEXTURE.x}
      y={TEXTURE.y}
      width={TEXTURE.width}
      height={TEXTURE.height}
      patternUnits="userSpaceOnUse"
    >
      <rect width={TEXTURE.width} height={TEXTURE.height} fill={SNOW_COLOR} fillOpacity=".12" />
      {specks.render({ fill: SNOW_COLOR }, 'specks')}
      {flakes.render({ stroke: SNOW_COLOR, strokeWidth: 1.3 }, 'flakes')}
    </pattern>
  );
}

const RAIN_TEXTURE = buildRainTexture();
const SNOW_TEXTURE = buildSnowTexture();

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
        {RAIN_TEXTURE}
        {SNOW_TEXTURE}
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
