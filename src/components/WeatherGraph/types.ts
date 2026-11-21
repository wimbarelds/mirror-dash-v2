export interface Point {
  x: number;
  y: number;
}

/** Maps a value (time, temperature, percentage) to a coordinate */
export type Scale = (value: number) => number;
