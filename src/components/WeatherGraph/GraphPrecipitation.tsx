import { HourPoint, isSnow } from '../../util/weather/selectors';
import { PLOT } from './constants';
import { PrecipitationConfig, usePrecipitationConfig } from './precipitation-config';
import { Scale } from './types';
import { smoothCurves } from './util';

interface Props {
  points: HourPoint[];
  x: Scale;
  /** Maps a chance of precipitation (0-100) to a height */
  chanceY: Scale;
}

/** The number of particle sizes, from the largest down to the smallest */
const SIZE_CLASSES = 6;

/** The sizes (as a radius in drawing units) the stroke is filled with, largest first */
const getSizes = ({ largestSize, smallestSize }: PrecipitationConfig) =>
  Array.from(
    { length: SIZE_CLASSES },
    (_, i) => largestSize * (smallestSize / largestSize) ** (i / (SIZE_CLASSES - 1)),
  );

/** Hours with precipitation, or a chance big enough to be worth drawing */
const isRainy = (point: HourPoint, config: PrecipitationConfig) =>
  point.precipProbability >= config.minChance || point.precipitation >= 0.1;

/**
 * Width of the stroke, measured across it: a minimum for any hour with precipitation to show, growing
 * with the square root of the amount so light rain stays visible, up to a limit. In drawing units.
 */
const getThickness = (point: HourPoint, config: PrecipitationConfig) =>
  isRainy(point, config)
    ? Math.min(
        config.maxThickness,
        config.minThickness + config.thicknessPerRootMm * Math.sqrt(point.precipitation),
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
function createProfile(points: HourPoint[], x: Scale, chanceY: Scale, config: PrecipitationConfig) {
  const xs = points.map((point) => x(point.time));
  const middle = smoothCurves(
    points.map((point, i) => ({ x: xs[i], y: chanceY(point.precipProbability) })),
    { top: PLOT.top, bottom: PLOT.bottom },
  );
  const thickness = smoothCurves(
    points.map((point, i) => ({ x: xs[i], y: getThickness(point, config) })),
    { top: 0, bottom: config.maxThickness },
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

type Point2 = [number, number];
/** A shape is a set of lines in a space where it has a radius of about 1 */
type Shape = { points: Point2[] }[];

const turn = ([x, y]: Point2, degrees: number): Point2 => {
  const angle = (degrees * Math.PI) / 180;
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
};

/** Repeats what is drawn on one arm at 0, 60 and 120 degrees, so it reads as a six-pointed crystal */
const sixFold = (arm: Point2[][]): Shape =>
  [0, 60, 120].flatMap((degrees) =>
    arm.map((line) => ({ points: line.map((point) => turn(point, degrees)) })),
  );

/**
 * Snowflakes get a shape that suits their size, like the forms real crystals take: the smallest are
 * plain specks (not in this list), then a simple asterisk, a star with small chevrons at the tips,
 * and the largest are detailed, branched crystals (two variants).
 */
const ASTERISK: Shape = sixFold([
  [
    [0, -1],
    [0, 1],
  ],
]);

const STAR: Shape = sixFold([
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
]);

/** A branch off the arm at distance `d` from the centre, spreading outwards by `b` */
const branch = (d: number, b: number): Point2[][] => [
  [
    [-b, -d - b * 1.1],
    [0, -d],
    [b, -d - b * 1.1],
  ],
  [
    [-b, d + b * 1.1],
    [0, d],
    [b, d + b * 1.1],
  ],
];

const DENDRITE: Shape = sixFold([
  [
    [0, -1],
    [0, 1],
  ],
  ...branch(0.42, 0.22),
  ...branch(0.74, 0.18),
]);

/** A finer crystal: more, shorter branches along each arm */
const FERN: Shape = sixFold([
  [
    [0, -1],
    [0, 1],
  ],
  ...branch(0.3, 0.14),
  ...branch(0.55, 0.14),
  ...branch(0.8, 0.11),
]);

/**
 * The shape of a flake follows the room it has (before it is drawn smaller): a speck, an asterisk, a
 * star, or a crystal. The thresholds are in the config.
 */
function flakeShape(radius: number, random: () => number, config: PrecipitationConfig): Shape {
  if (radius < config.asteriskBelow) return ASTERISK;
  if (radius < config.starBelow) return STAR;
  return random() < config.dendriteShare ? DENDRITE : FERN;
}

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

/** Path data for a snowflake of the given shape and radius, turned by `degrees` */
function flakePath(x: number, y: number, radius: number, degrees: number, shape: Shape) {
  const p = placer(x, y, radius, degrees);
  return shape
    .map(({ points }) => points.map((point, i) => `${i === 0 ? 'M' : 'L'}${p(point)}`).join(''))
    .join('');
}

/** A filled circle as path data */
const speckPath = (x: number, y: number, r: number) =>
  `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0Z`;

interface Layout {
  drops: string;
  flakes: string;
  specks: string;
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
function layOut(
  points: HourPoint[],
  x: Scale,
  chanceY: Scale,
  config: PrecipitationConfig,
): Layout {
  const profile = createProfile(points, x, chanceY, config);
  const samples = sampleStroke(profile);
  const total = samples[samples.length - 1].length;
  const area = samples.reduce((sum, sample) => sum + sample.thickness * 2, 0);

  const random = createRandom(config.seed);
  let drops = '';
  let flakes = '';
  let specks = '';

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
          if (Math.hypot(px - other.x, py - other.y) < (radius + other.r) * config.spacing) {
            return true;
          }
        }
      }
    }
    return false;
  };

  for (const size of getSizes(config)) {
    const attempts = Math.ceil((area / (size * size * 4)) * config.fill);

    for (let attempt = 0; attempt < attempts; attempt++) {
      const sample = sampleAt(samples, random() * total);
      const radius = size * (1 - config.sizeVariation * random());
      const room = sample.thickness / 2 - radius - config.edgeMargin;
      if (room < 0 || radius > sample.thickness * config.maxSizeShare) continue;

      const offset = (random() * 2 - 1) * room;
      const px = sample.x + sample.nx * offset;
      const py = sample.y + sample.ny * offset;
      if (py - radius < PLOT.top + 1 || py + radius > PLOT.bottom - 1) continue;
      if (collides(px, py, radius)) continue;

      const index = placed.push({ x: px, y: py, r: radius }) - 1;
      const key = cellKey(Math.floor(px / CELL), Math.floor(py / CELL));
      grid.set(key, [...(grid.get(key) ?? []), index]);

      // The kind of particle follows the room it has; how big it is drawn is a separate choice
      const drawn = radius * config.drawScale;
      if (isSnow(sample.nearest)) {
        if (radius < config.speckBelow) specks += speckPath(px, py, drawn * 0.7);
        else flakes += flakePath(px, py, drawn, random() * 60, flakeShape(radius, random, config));
      } else if (radius < config.dropSpeckBelow) {
        drops += speckPath(px, py, drawn * 0.75);
      } else {
        drops += dropPath(px, py, drawn, 6 + random() * 14);
      }
    }
  }

  /** The outline of the stroke, for the faint background */
  const edge = (s: Sample, side: 1 | -1) =>
    `${(s.x + (side * s.nx * s.thickness) / 2).toFixed(1)} ${(s.y + (side * s.ny * s.thickness) / 2).toFixed(1)}`;
  const upper = samples.map((s) => edge(s, -1));
  const lower = samples.map((s) => edge(s, 1)).reverse();

  return { drops, flakes, specks, background: `M${upper.join('L')}L${lower.join('L')}Z` };
}

/** The layout only depends on the hourly values and the settings, so it isn't redone when only the clock changes */
let cache: { key: string; layout: Layout } | undefined;

function getLayout(points: HourPoint[], x: Scale, chanceY: Scale, config: PrecipitationConfig) {
  const key =
    points
      .map((p) => `${p.time}/${p.precipProbability}/${p.precipitation}/${p.weatherCode}`)
      .join(',') + JSON.stringify(config);
  if (cache?.key !== key) cache = { key, layout: layOut(points, x, chanceY, config) };
  return cache.layout;
}

/**
 * Precipitation as a stroke made of raindrops (blue) and snowflakes (white). It follows the chance of
 * precipitation (read from the right-hand axis) and is as wide as the amount expected. Particle sizes
 * vary, and are limited by how wide the stroke is where they sit.
 */
export function GraphPrecipitation({ points, x, chanceY }: Props) {
  const config = usePrecipitationConfig();
  const { drops, flakes, specks, background } = getLayout(points, x, chanceY, config);

  return (
    <g>
      <path d={background} fill={config.snowColor} fillOpacity={config.backgroundOpacity} />
      <path d={drops} fill={config.rainColor} />
      <path d={specks} fill={config.snowColor} />
      <path
        d={flakes}
        fill="none"
        stroke={config.snowColor}
        strokeWidth={config.flakeLineWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
