import { HourPoint } from '../../util/weather/selectors';
import { PLOT } from './constants';
import { Scale } from './types';
import { smoothPath, temperatureToColor } from './util';

interface Props {
  points: HourPoint[];
  now: number;
  x: Scale;
  y: Scale;
}

const GRADIENT_ID = 'temperature-gradient';

/** The temperature at a moment, interpolated between the two surrounding hours */
function temperatureAt(points: HourPoint[], now: number) {
  const index = points.findIndex((point, i) => point.time <= now && now < points[i + 1]?.time);
  if (index === -1) return null;
  const [a, b] = [points[index], points[index + 1]];
  const amount = (now - a.time) / (b.time - a.time);
  return a.temperature + (b.temperature - a.temperature) * amount;
}

export function GraphTemperature({ points, now, x, y }: Props) {
  const temperatures = points.map((point) => point.temperature);
  const highest = temperatures.indexOf(Math.max(...temperatures));
  const lowest = temperatures.indexOf(Math.min(...temperatures));
  const current = temperatureAt(points, now);

  return (
    <g>
      <defs>
        {/* The line changes colour along with the temperature */}
        <linearGradient
          id={GRADIENT_ID}
          gradientUnits="userSpaceOnUse"
          x1={PLOT.left}
          x2={PLOT.right}
          y1="0"
          y2="0"
        >
          {points.map((point) => (
            <stop
              key={point.time}
              offset={(x(point.time) - PLOT.left) / (PLOT.right - PLOT.left)}
              stopColor={temperatureToColor(point.temperature)}
            />
          ))}
        </linearGradient>
      </defs>
      <path
        d={smoothPath(points.map((point) => ({ x: x(point.time), y: y(point.temperature) })))}
        fill="none"
        stroke={`url(#${GRADIENT_ID})`}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {current !== null && (
        <g>
          <line
            x1={x(now)}
            x2={x(now)}
            y1={PLOT.top}
            y2={PLOT.bottom}
            stroke="white"
            strokeOpacity=".4"
            strokeDasharray="3 7"
          />
          <circle
            cx={x(now)}
            cy={y(current)}
            r="8"
            fill={temperatureToColor(current)}
            stroke="black"
            strokeWidth="2"
          />
        </g>
      )}
      {points.map((point, index) => {
        const isEdge = index === 0 || index === points.length - 1;
        const isLabelled =
          new Date(point.time).getHours() % 3 === 0 || index === highest || index === lowest;
        if (isEdge || !isLabelled) return null;
        return (
          <text
            key={point.time}
            x={x(point.time)}
            y={y(point.temperature) - 16}
            fontSize="22"
            textAnchor="middle"
            fill={temperatureToColor(point.temperature)}
          >
            {Math.round(point.temperature)}°
          </text>
        );
      })}
    </g>
  );
}
