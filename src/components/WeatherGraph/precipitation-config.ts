import { createContext, useContext } from 'react';

/**
 * Everything that shapes how precipitation is drawn. The defaults are what the mirror uses; the replay
 * page can provide other values (see src/replay) to try out a look without editing code.
 */
export interface PrecipitationConfig {
  /** Size: the share of the room a particle has that it is drawn at */
  drawScale: number;
  /** Size: the largest and smallest room a particle is given (a radius, in drawing units) */
  largestSize: number;
  smallestSize: number;
  /** Size: how much sizes vary within a size class (0 = all the same) */
  sizeVariation: number;
  /** Size: the largest particle allowed, as a share of how wide the stroke is where it sits */
  maxSizeShare: number;

  /** Density: how much room particles keep around each other (1 = touching) */
  spacing: number;
  /** Density: free space between a particle and the edge of the stroke */
  edgeMargin: number;
  /** Density: how hard the gaps are filled (more tries per size) */
  fill: number;

  /** Stroke: width across it, at the least and at the most, and extra per square root of mm */
  minThickness: number;
  maxThickness: number;
  thicknessPerRootMm: number;
  /** Stroke: the lowest chance of precipitation (%) that is drawn when no rain is expected */
  minChance: number;
  /** Stroke: a faint tint behind the particles (0 = none) */
  backgroundOpacity: number;

  /** Shapes: flakes below `speckBelow` are specks, then asterisks, stars, and from `starBelow` crystals */
  speckBelow: number;
  asteriskBelow: number;
  starBelow: number;
  /** Shapes: raindrops below this are dots */
  dropSpeckBelow: number;
  /** Shapes: how many of the crystals are the sparser dendrite, rather than the finer fern */
  dendriteShare: number;
  flakeLineWidth: number;
  rainColor: string;
  snowColor: string;

  /** Changing this gives a different, equally random arrangement */
  seed: number;
}

export const defaultPrecipitationConfig: PrecipitationConfig = {
  drawScale: 0.62,
  largestSize: 8,
  smallestSize: 2.7,
  sizeVariation: 0.15,
  maxSizeShare: 0.3,

  spacing: 1.06,
  edgeMargin: 1.5,
  fill: 1.5,

  minThickness: 16,
  maxThickness: 68,
  thicknessPerRootMm: 26,
  minChance: 25,
  backgroundOpacity: 0.05,

  speckBelow: 3.5,
  asteriskBelow: 4.8,
  starBelow: 6.4,
  dropSpeckBelow: 2.7,
  dendriteShare: 0.5,
  flakeLineWidth: 1.1,
  rainColor: '#8fc3ff',
  snowColor: '#ffffff',

  seed: 5,
};

export const PrecipitationConfigContext = createContext(defaultPrecipitationConfig);

export const usePrecipitationConfig = () => useContext(PrecipitationConfigContext);
