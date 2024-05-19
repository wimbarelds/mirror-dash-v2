import { Point, Range, Scaler } from './types';

export function GraphLine({
  color,
  xRange,
  yRange,
  data,
  scaler,
}: {
  color: string;
  xRange: Range;
  yRange: Range;
  data: Point[];
  scaler: Scaler;
}) {
  const temperaturePath =
    xRange && yRange
      ? data
          .reduce((paths: string[], value: Point, i: number) => {
            const x = scaler.x(
              (value.x - xRange.min) / (xRange.max - xRange.min),
            );
            const y = scaler.y(
              (value.y - yRange.min) / (yRange.max - yRange.min),
            );
            const char = i === 0 ? 'M' : 'L';
            paths.push(`${char} ${x} ${y}`);
            return paths;
          }, [])
          .join(' ')
      : '';
  return (
    <path
      d={temperaturePath}
      stroke={color}
      fill="transparent"
      strokeWidth="1"
    />
  );
}
