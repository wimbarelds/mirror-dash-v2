import { HourPoint, isSnow } from '../../util/weather/selectors';
import { PLOT } from './constants';
import { Scale } from './types';
import { smoothCurves } from './util';

interface Props {
  points: HourPoint[];
  x: Scale;
  /** Maps a chance of precipitation (0-100) to a height */
  chanceY: Scale;
}

const RAIN_COLOR = '#8fc3ff';
const SNOW_COLOR = '#ffffff';

/** A barely visible tint behind the particles, so the shape of the stroke still reads. 0 switches it off. */
const BACKGROUND_OPACITY = 0.05;

/**
 * Width of the stroke, measured across it: a minimum for any hour with precipitation to show, growing
 * with the square root of the amount so light rain stays visible, up to a limit. In drawing units.
 */
const MIN_THICKNESS = 16;
const THICKNESS_PER_ROOT_MM = 26;
const MAX_THICKNESS = 68;

/**
 * The particles (raindrops and snowflakes) come in a range of sizes, as a radius in drawing units. The
 * stroke is filled from the largest to the smallest so the sizes mix. How big a particle may be
 * depends on how wide the stroke is where it sits: a thin stroke only gets small particles.
 */
const SIZES = [8, 6.5, 5.2, 4.2, 3.4, 2.7];
const MAX_SIZE_SHARE_OF_WIDTH = 0.3;
const EDGE_MARGIN = 1.5;
/** How much room particles keep around each other, as a factor on their radii added together */
const SPACING = 1.06;

/** Hours with precipitation, or a chance big enough to be worth drawing */
const isRainy = (point: HourPoint) => point.precipProbability >= 25 || point.precipitation >= 0.1;

const getThickness = (point: HourPoint) =>
  isRainy(point)
    ? Math.min(
        MAX_THICKNESS,
        MIN_THICKNESS + THICKNESS_PER_ROOT_MM * Math.sqrt(point.precipitation),
      )
    : 0;

/** A small seeded random number generator: the layout looks random, but is always the same */
function createRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bezier = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

/**
 * The stroke as seen from any x: where its middle is, how wide it is, and which hour is closest.
 * Both follow the same smooth curves through the hourly values, so particles line up with the shape.
 */
function createProfile(points: HourPoint[], x: Scale, chanceY: Scale) {
  const xs = points.map((point) => x(point.time));
  const middle = smoothCurves(
    points.map((point, i) => ({ x: xs[i], y: chanceY(point.precipProbability) })),
    { top: PLOT.top, bottom: PLOT.bottom },
  );
  const thickness = smoothCurves(
    points.map((point, i) => ({ x: xs[i], y: getThickness(point) })),
    { top: 0, bottom: MAX_THICKNESS },
  );

  return {
    start: xs[0],
    end: xs[xs.length - 1],
    at(px: number) {
      let i = 0;
      while (i < middle.length - 1 && xs[i + 1] <= px) i++;
      const [m, k] = [middle[i], thickness[i]];

      // x grows steadily along a segment, so the position along it can be found by halving
      let [low, high] = [0, 1];
      for (let step = 0; step < 14; step++) {
        const mid = (low + high) / 2;
        if (bezier(m.from.x, m.c1.x, m.c2.x, m.to.x, mid) < px) low = mid;
        else high = mid;
      }
      const t = (low + high) / 2;

      return {
        y: bezier(m.from.y, m.c1.y, m.c2.y, m.to.y, t),
        thickness: Math.max(0, bezier(k.from.y, k.c1.y, k.c2.y, k.to.y, t)),
        nearest: points[t < 0.5 ? i : i + 1],
      };
    },
  };
}

interface Sample {
  x: number;
  y: number;
  /** Unit vector across the stroke (pointing down) */
  nx: number;
  ny: number;
  thickness: number;
  nearest: HourPoint;
  /** Distance along the stroke from its start */
  length: number;
}

/** The middle of the stroke at regular steps, with its direction and how far along it is */
function sampleStroke(profile: ReturnType<typeof createProfile>) {
  const samples: Sample[] = [];
  let length = 0;

  for (let px = profile.start; px <= profile.end; px += 2) {
    const here = profile.at(px);
    const slope = profile.at(px + 1).y - here.y;
    const norm = Math.hypot(1, slope);

    const previous = samples[samples.length - 1];
    if (previous) length += Math.hypot(px - previous.x, here.y - previous.y);

    samples.push({
      x: px,
      y: here.y,
      nx: -slope / norm,
      ny: 1 / norm,
      thickness: here.thickness,
      nearest: here.nearest,
      length,
    });
  }
  return samples;
}

/** A raindrop: a round body with a slight tip. Positions are in a space where the body has radius 1. */
const DROP_CONTROL: [number, number][] = [
  [0, -1.35], // tip
  [0.3, -0.75],
  [1, -0.2],
  [1, 0.4], // right of the body
  [-1, 0.4], // left of the body (reached by an arc)
  [-1, -0.2],
  [-0.3, -0.75],
];

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

/** Moves, scales and turns a point of a particle into its place in the graph */
function placer(x: number, y: number, scale: number, degrees: number) {
  const angle = (degrees * Math.PI) / 180;
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  return ([px, py]: [number, number]) =>
    `${(x + scale * (px * cos - py * sin)).toFixed(1)} ${(y + scale * (px * sin + py * cos)).toFixed(1)}`;
}

/** Path data for a raindrop that fits in a circle of the given radius, leaning by `degrees` */
function dropPath(x: number, y: number, radius: number, degrees: number) {
  const scale = radius / 1.4;
  const p = placer(x, y, scale, degrees);
  const [tip, c1, c2, right, left, c3, c4] = DROP_CONTROL;
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

interface Layout {
  drops: string;
  flakes: string;
  background: string;
}

/** Index of the last sample that is not further along the stroke than the given length */
function sampleAt(samples: Sample[], length: number) {
  let [low, high] = [0, samples.length - 1];
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (samples[mid].length <= length) low = mid;
    else high = mid - 1;
  }
  return samples[low];
}

/**
 * Lays out the precipitation: raindrops and snowflakes filling the stroke from end to end. Particles
 * are placed from the largest size down to the smallest, each at a random spot where it fits wholly
 * inside the stroke (and inside the graph) without touching another, so sizes mix in a wide stroke,
 * only small ones fit in a thin stroke, and nothing is ever cut off.
 */
function layOut(points: HourPoint[], x: Scale, chanceY: Scale): Layout {
  const profile = createProfile(points, x, chanceY);
  const samples = sampleStroke(profile);
  const total = samples[samples.length - 1].length;
  const area = samples.reduce((sum, sample) => sum + sample.thickness * 2, 0);

  const random = createRandom(5);
  let drops = '';
  let flakes = '';

  // A grid of the particles placed so far, to find neighbours quickly
  const CELL = 18;
  const placed: { x: number; y: number; r: number }[] = [];
  const grid = new Map<number, number[]>();
  const cellKey = (gx: number, gy: number) => gx * 64 + gy;

  const collides = (px: number, py: number, radius: number) => {
    const [gx, gy] = [Math.floor(px / CELL), Math.floor(py / CELL)];
    for (let ix = gx - 1; ix <= gx + 1; ix++) {
      for (let iy = gy - 1; iy <= gy + 1; iy++) {
        for (const index of grid.get(cellKey(ix, iy)) ?? []) {
          const other = placed[index];
          if (Math.hypot(px - other.x, py - other.y) < (radius + other.r) * SPACING) return true;
        }
      }
    }
    return false;
  };

  for (const size of SIZES) {
    const attempts = Math.ceil((area / (size * size * 4)) * 1.5);

    for (let attempt = 0; attempt < attempts; attempt++) {
      const sample = sampleAt(samples, random() * total);
      const radius = size * (0.85 + 0.15 * random());
      const room = sample.thickness / 2 - radius - EDGE_MARGIN;
      if (room < 0 || radius > sample.thickness * MAX_SIZE_SHARE_OF_WIDTH) continue;

      const offset = (random() * 2 - 1) * room;
      const px = sample.x + sample.nx * offset;
      const py = sample.y + sample.ny * offset;
      if (py - radius < PLOT.top + 1 || py + radius > PLOT.bottom - 1) continue;
      if (collides(px, py, radius)) continue;

      const index = placed.push({ x: px, y: py, r: radius }) - 1;
      const key = cellKey(Math.floor(px / CELL), Math.floor(py / CELL));
      grid.set(key, [...(grid.get(key) ?? []), index]);

      if (isSnow(sample.nearest)) flakes += flakePath(px, py, radius, random() * 60);
      else drops += dropPath(px, py, radius, 6 + random() * 14);
    }
  }

  /** The outline of the stroke, for the faint background */
  const edge = (s: Sample, side: 1 | -1) =>
    `${(s.x + (side * s.nx * s.thickness) / 2).toFixed(1)} ${(s.y + (side * s.ny * s.thickness) / 2).toFixed(1)}`;
  const upper = samples.map((s) => edge(s, -1));
  const lower = samples.map((s) => edge(s, 1)).reverse();

  return { drops, flakes, background: `M${upper.join('L')}L${lower.join('L')}Z` };
}

/** The layout only depends on the hourly values, so it is not redone when only the clock changes */
let cache: { key: string; layout: Layout } | undefined;

function getLayout(points: HourPoint[], x: Scale, chanceY: Scale) {
  const key = points
    .map((p) => `${p.time}/${p.precipProbability}/${p.precipitation}/${p.weatherCode}`)
    .join(',');
  if (cache?.key !== key) cache = { key, layout: layOut(points, x, chanceY) };
  return cache.layout;
}

/**
 * Precipitation as a stroke made of raindrops (blue) and snowflakes (white). It follows the chance of
 * precipitation (read from the right-hand axis) and is as wide as the amount expected. Particle sizes
 * vary, and are limited by how wide the stroke is where they sit.
 */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  const { drops, flakes, background } = getLayout(points, x, chanceY);

  return (
    <g>
      <path d={background} fill={SNOW_COLOR} fillOpacity={BACKGROUND_OPACITY} />
      <path d={drops} fill={RAIN_COLOR} />
      <path
        d={flakes}
        fill="none"
        stroke={SNOW_COLOR}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
