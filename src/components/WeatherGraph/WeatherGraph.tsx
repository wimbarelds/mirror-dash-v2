import { formatHour } from '../../util/time';
import { HourPoint } from '../../util/weather/selectors';
import { HOUR_LABEL_Y, PLOT, VIEW } from './constants';
import { GraphIce } from './GraphIce';
import { GraphPrecipitation } from './GraphPrecipitation';
import { GraphTemperature } from './GraphTemperature';
import { getTemperatureAxis, linearScale } from './util';

interface Props {
  points: HourPoint[];
  now: number;
}

const CLIP_ID = 'plot-clip';

/** The next 24 hours: temperature (left axis) with chance and amount of rain (right axis) */
export function WeatherGraph({ points, now }: Props) {
  if (points.length < 2) return null;

  const x = linearScale(points[0].time, points[points.length - 1].time, PLOT.left, PLOT.right);
  const axis = getTemperatureAxis(points.map((point) => point.temperature));
  const y = linearScale(axis.min, axis.max, PLOT.bottom, PLOT.top);
  const chanceY = linearScale(0, 100, PLOT.bottom, PLOT.top);

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      className="block h-auto w-full font-light"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={CLIP_ID}>
          <rect
            x={PLOT.left}
            y={PLOT.top - 26}
            width={PLOT.right - PLOT.left}
            height={PLOT.bottom - PLOT.top + 26}
          />
        </clipPath>
      </defs>

      <g stroke="white" strokeOpacity=".35" strokeWidth="2">
        <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.bottom} />
        <line x1={PLOT.right} x2={PLOT.right} y1={PLOT.top} y2={PLOT.bottom} />
        <line x1={PLOT.left} x2={PLOT.right} y1={PLOT.bottom} y2={PLOT.bottom} />
      </g>

      {axis.ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={PLOT.left}
            x2={PLOT.right}
            y1={y(tick)}
            y2={y(tick)}
            stroke="white"
            strokeOpacity=".1"
          />
          <text
            x={PLOT.left - 10}
            y={y(tick) + 7}
            fontSize="20"
            textAnchor="end"
            fill="white"
            fillOpacity=".6"
          >
            {tick}°
          </text>
        </g>
      ))}

      {[0, 50, 100].map((chance) => (
        <text
          key={chance}
          x={PLOT.right + 10}
          y={chanceY(chance) + 7}
          fontSize="20"
          fill="#8fc3ff"
          fillOpacity=".7"
        >
          {chance}%
        </text>
      ))}

      <g clipPath={`url(#${CLIP_ID})`}>
        <GraphPrecipitation points={points} x={x} chanceY={chanceY} />
      </g>
      <GraphIce points={points} x={x} />
      <GraphTemperature points={points} now={now} x={x} y={y} />

      {points.map(
        (point) =>
          new Date(point.time).getHours() % 3 === 0 && (
            <text
              key={point.time}
              x={x(point.time)}
              y={HOUR_LABEL_Y}
              fontSize="22"
              textAnchor="middle"
              fill="white"
              fillOpacity=".55"
            >
              {formatHour(point.time)}
            </text>
          ),
      )}
    </svg>
  );
}
