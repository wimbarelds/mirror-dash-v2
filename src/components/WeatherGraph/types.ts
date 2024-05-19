export interface DataPoint {
  temperature?: number;
  precipProbability?: number;
  precipIntensity?: number;
  time?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PrecipitationPoint extends Point {
  h: number;
}

export interface RangePoint {
  value: number;
  text: string;
  pos: number;
}

export interface Range {
  min: number;
  max: number;
  range: RangePoint[];
}

export type Scaler = {
  size: Point;
  margins: Point;
  x: (pct: number) => number;
  y: (pct: number) => number;
};
