import { createContext, useContext } from 'react';

/**
 * Everything that shapes how precipitation is drawn. The defaults are what the mirror uses; the replay
 * page can provide other values (see src/replay) to try out a look without editing code.
 */
export interface PrecipitationConfig {
  /** Size: the share of the room a particle has that it is drawn at */
  drawScale: number;
  /** Size: raindrops are drawn this much larger than snow, as small light-blue drops are hard to see */
  rainScale: number;
  /** Size: the largest and smallest room a particle is given (a radius, in drawing units) */
  largestSize: number;
  smallestSize: number;
  /** Size: how much sizes vary within a size class (0 = all the same) */
  sizeVariation: number;
  /** Size: the largest particle allowed, as a share of how wide the stroke is where it sits */
  maxSizeShare: number;

  /** Density: how much room particles keep around each other (1 = touching) */
  spacing: number;
  /** Density: how hard the gaps are filled (more tries per size) */
  fill: number;

  /** Stroke: width across it, at the least and at the most, and extra per square root of mm */
  minThickness: number;
  maxThickness: number;
  thicknessPerRootMm: number;
  /** Stroke: the lowest chance of precipitation (%) that is drawn when no rain is expected */
  minChance: number;

  /** Shapes: snow below `speckBelow` is a speck, then an asterisk, and from `asteriskBelow` a star */
  speckBelow: number;
  asteriskBelow: number;
  /** Shapes: raindrops below this are dots */
  dropSpeckBelow: number;
  /** Shapes: rain leans this many degrees, as if blown by the wind */
  rainSlant: number;
  rainColor: string;
  snowColor: string;

  /** Changing this gives a different, equally random arrangement */
  seed: number;
}

export const defaultPrecipitationConfig: PrecipitationConfig = {
  drawScale: 0.35,
  rainScale: 1.6,
  largestSize: 5.2,
  smallestSize: 3,
  sizeVariation: 0.45,
  maxSizeShare: 0.21,

  spacing: 1.12,
  fill: 2.2,

  minThickness: 15,
  maxThickness: 68,
  thicknessPerRootMm: 26,
  minChance: 0,

  speckBelow: 3.7,
  asteriskBelow: 4.8,
  dropSpeckBelow: 2.7,
  rainSlant: 20,
  rainColor: '#8fc3ff',
  snowColor: '#ffffff',

  seed: 5,
};

export const PrecipitationConfigContext = createContext(defaultPrecipitationConfig);

export const usePrecipitationConfig = () => useContext(PrecipitationConfigContext);
