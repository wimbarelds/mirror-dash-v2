import { Point, Range, Scaler } from './types';
import { pointToScaled, temperatureToColor } from './util';

export function GraphTemperature({
  xRange,
  yRange,
  data,
  scaler,
}: {
  xRange: Range;
  yRange: Range;
  data: Point[];
  scaler: Scaler;
}) {
  const gradientColors: string[] = data.map((point: Point) => {
    const color = temperatureToColor(point.y);
    return color;
  });

  const linePath =
    data.length > 0
      ? `M ${pointToScaled(data[0], xRange, yRange, scaler)}${data
          .slice(1)
          .map((point) => ` L ${pointToScaled(point, xRange, yRange, scaler)}`)
          .join('')}`
      : '';

  const fillPath =
    data.length > 0
      ? `${linePath} L ${pointToScaled(
          {
            x: data[data.length - 1].x,
            y: yRange.min,
          },
          xRange,
          yRange,
          scaler,
        )} L ${pointToScaled(
          {
            x: data[0].x,
            y: yRange.min,
          },
          xRange,
          yRange,
          scaler,
        )} L ${pointToScaled(data[0], xRange, yRange, scaler)}`
      : '';

  const graphPoints = data.map((point: Point, i: number) => ({
    index: i,
    pos: {
      x: scaler.x((point.x - xRange.min) / (xRange.max - xRange.min)),
      y: scaler.y((point.y - yRange.min) / (yRange.max - yRange.min)),
    },
  }));

  const graphTexts = data
    .slice(1, data.length - 1)
    .map((point: Point, i: number) => ({
      index: i,
      pos: {
        x: scaler.x((point.x - xRange.min) / (xRange.max - xRange.min)),
        y: scaler.y((point.y - yRange.min) / (yRange.max - yRange.min)) - 10,
      },
      text: Math.round(point.y) + '°',
    }));

  return (
    <g id="temperature">
      <defs>
        <linearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="0%">
          {gradientColors.map((color, index) => (
            <stop
              key={index}
              offset={
                Math.floor((index / (gradientColors.length - 1)) * 100) + '%'
              }
              stopColor={color}
            />
          ))}
        </linearGradient>
      </defs>
      <g id="FillSegment">
        <path
          d={fillPath}
          stroke="transparent"
          fill="url(#linear)"
          opacity="0.8"
        />
      </g>
      <g id="LineSegment">
        <path
          d={linePath}
          stroke="url(#linear)"
          strokeWidth="1"
          fill="transparent"
        />
      </g>
      <g id="GraphPoints">
        {graphPoints.map((graphPoint) => (
          <circle
            key={graphPoint.index}
            cx={graphPoint.pos.x}
            cy={graphPoint.pos.y}
            r="3"
            fill="#FFF"
            stroke="rgba(0,0,0,0.75)"
          />
        ))}
      </g>
      <g id="GraphTexts">
        {graphTexts.map((graphText) => (
          <text
            key={graphText.index}
            x={graphText.pos.x}
            y={graphText.pos.y}
            fontSize="12"
            fill="#FFF"
            textAnchor="middle"
            dominantBaseline="bottom"
          >
            {graphText.text}
          </text>
        ))}
      </g>
    </g>
  );
}
