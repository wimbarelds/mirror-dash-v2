/** The graph is drawn in this fixed coordinate space and scaled to its container by the SVG viewBox */
export const VIEW = { width: 1150, height: 340 };

/** The framed area; the margins around it hold the axis labels */
export const PLOT = { left: 64, right: 1086, top: 26, bottom: 290 };

export const HOUR_LABEL_Y = 330;

/** Temperature colours: blue below freezing, white at 0°, yellow around 15°, red when hot */
export const colors = {
  veryCold: [0x8f, 0x8c, 0xff],
  cold: [0x6e, 0xe0, 0xb4],
  warm: [0xff, 0xff, 0x66],
  hot: [0xff, 0x00, 0x00],
};
