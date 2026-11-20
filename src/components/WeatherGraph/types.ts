export interface Point {
  x: number;
  y: number;
}

/** Maps a value (time, temperature, percentage) to a coordinate in the graph's drawing space */
export type Scale = (value: number) => number;
