/**
 * Screen and display fingerprinting.
 */

import { sha256 } from '../hash.js';

export async function collectScreen() {
  const data = {
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    devicePixelRatio: window.devicePixelRatio,
    orientation: screen.orientation?.type || 'unknown',
  };

  const hash = await sha256(JSON.stringify(data));

  return {
    name: 'Screen',
    category: 'hardware',
    value: data,
    displayValue: `${data.width}x${data.height} @ ${data.devicePixelRatio}x, ${data.colorDepth}-bit`,
    entropy: 4.2,
    description: 'Your screen resolution, available area (accounts for taskbar/dock), color depth, and pixel ratio. The available area is especially identifying because it reveals your OS UI configuration.',
    mitigation: 'Resize your browser window to a common size. Firefox resistFingerprinting reports a rounded window size.',
  };
}
