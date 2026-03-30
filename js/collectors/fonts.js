/**
 * Font enumeration fingerprinting.
 * Tests which fonts are installed by measuring text rendering differences.
 */

import { sha256 } from '../hash.js';

const TEST_FONTS = [
  'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Cambria Math',
  'Comic Sans MS', 'Consolas', 'Courier', 'Courier New', 'Georgia',
  'Helvetica', 'Helvetica Neue', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
  'Microsoft Sans Serif', 'Monaco', 'Palatino Linotype', 'Segoe UI',
  'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana',
  'Menlo', 'SF Pro', 'SF Mono', 'Avenir', 'Futura', 'Optima',
  'American Typewriter', 'Baskerville', 'Big Caslon', 'Bodoni 72',
  'Bradley Hand', 'Brush Script MT', 'Chalkboard', 'Chalkduster',
  'Cochin', 'Copperplate', 'Didot', 'Gill Sans', 'Herculanum',
  'Hoefler Text', 'Luminari', 'Marker Felt', 'Noteworthy', 'Papyrus',
  'Phosphate', 'Rockwell', 'Savoye LET', 'SignPainter', 'Skia',
  'Snell Roundhand', 'Zapfino',
  'Ubuntu', 'Ubuntu Mono', 'DejaVu Sans', 'DejaVu Serif', 'Liberation Mono',
  'Liberation Sans', 'Noto Sans', 'Noto Serif', 'Droid Sans', 'Droid Serif',
  'Cantarell', 'Fira Sans', 'Fira Mono',
  'Malgun Gothic', 'Microsoft YaHei', 'SimSun', 'PMingLiU',
  'MS Gothic', 'Meiryo', 'Yu Gothic',
  'Lato', 'Open Sans', 'Roboto', 'Source Sans Pro', 'Montserrat',
  'Oswald', 'Raleway', 'PT Sans', 'Merriweather', 'Playfair Display',
  'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji',
  'Wingdings', 'Webdings', 'Symbol', 'Marlett',
  'Franklin Gothic Medium', 'Garamond', 'Century Gothic', 'Candara',
  'Constantia', 'Corbel', 'Ebrima', 'Gabriola', 'Leelawadee',
  'Lucida Bright', 'MV Boli', 'Nirmala UI', 'Sitka Text',
  'Sylfaen', 'Book Antiqua', 'Perpetua', 'Tw Cen MT',
];

const BASELINES = ['monospace', 'sans-serif', 'serif'];
const TEST_STRING = 'mmmmmmmmmmlli';
const TEST_SIZE = '72px';

export async function collectFonts() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Measure baseline widths
  const baselineWidths = {};
  for (const base of BASELINES) {
    ctx.font = `${TEST_SIZE} ${base}`;
    baselineWidths[base] = ctx.measureText(TEST_STRING).width;
  }

  // Test each font
  const detected = [];
  for (const font of TEST_FONTS) {
    let found = false;
    for (const base of BASELINES) {
      ctx.font = `${TEST_SIZE} '${font}', ${base}`;
      const width = ctx.measureText(TEST_STRING).width;
      if (width !== baselineWidths[base]) {
        found = true;
        break;
      }
    }
    if (found) {
      detected.push(font);
    }
  }

  const hash = await sha256(detected.join(','));

  return {
    name: 'Fonts',
    category: 'browser',
    value: detected,
    displayValue: `${detected.length} fonts detected`,
    entropy: 7.1,
    description: `Tests ${TEST_FONTS.length} fonts by measuring text rendering width. If the width differs from the baseline fallback font, that font is installed. Your installed font list is highly unique, especially on macOS and Windows.`,
    mitigation: 'Firefox resistFingerprinting blocks font enumeration. Use a standard font set or the Tor Browser.',
  };
}
