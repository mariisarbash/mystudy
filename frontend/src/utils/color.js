/**
 * Keeps user-chosen course colours readable behind text.
 *
 * Course colours come from a colour picker, so they can be anything, and the
 * app painted the course name, the professor and the CFU white on top of
 * them. That fails badly on a pale colour, and it already failed on the
 * default blue: white on #3a7bd5 is 4.2:1, under the WCAG AA minimum of
 * 4.5:1.
 *
 * Picking black instead does not rescue the mid-tones — on #3a7bd5 near-black
 * is only 3.5:1, so *neither* plain choice passes. The surface itself has to
 * move. `surfaceFor` keeps the hue and darkens the colour just enough for
 * white text to clear 4.5:1.
 *
 * The raw colour is still used where it is decorative rather than a text
 * background: progress bars, the session stripe, the calendar legend.
 */

const TARGET_RATIO = 4.5;
const WHITE_LUMINANCE = 1;

const toRgb = (hex) => {
  const clean = String(hex || '').replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** WCAG relative luminance of an sRGB colour. */
const luminance = ([r, g, b]) => {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrastWithWhite = (rgb) => (WHITE_LUMINANCE + 0.05) / (luminance(rgb) + 0.05);

/**
 * A background derived from `hex` that carries white text at >= 4.5:1.
 * Returns `hex` untouched when it already does.
 */
export const surfaceFor = (hex) => {
  const rgb = toRgb(hex);
  if (!rgb) return '#2a66b3';

  let current = rgb;
  // Darken in small steps, preserving hue, until white text passes. 60 steps
  // of 4% reaches near-black, so this always terminates.
  for (let i = 0; i < 60 && contrastWithWhite(current) < TARGET_RATIO; i++) {
    current = current.map((v) => v * 0.96);
  }
  return toHex(current);
};

/** Text colour to use on `surfaceFor(hex)`. Always white, by construction. */
export const textOnSurface = () => '#ffffff';
