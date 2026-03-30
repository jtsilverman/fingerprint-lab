/**
 * AudioContext fingerprinting.
 * Different audio stacks produce slightly different floating-point results.
 */

import { sha256 } from '../hash.js';

export async function collectAudio() {
  try {
    const ctx = new OfflineAudioContext(1, 44100, 44100);

    const oscillator = ctx.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, ctx.currentTime);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, ctx.currentTime);
    compressor.knee.setValueAtTime(40, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    oscillator.connect(compressor);
    compressor.connect(ctx.destination);
    oscillator.start(0);

    const buffer = await ctx.startRendering();
    const samples = buffer.getChannelData(0);

    // Hash a slice of the output (samples 4500-5000 are most variable)
    const slice = Array.from(samples.slice(4500, 4600));
    const fingerprint = slice.map(v => v.toFixed(6)).join(',');
    const hash = await sha256(fingerprint);

    return {
      name: 'AudioContext',
      category: 'hardware',
      value: hash,
      displayValue: hash.substring(0, 16) + '...',
      entropy: 5.4,
      description: 'Plays an inaudible tone through a virtual audio pipeline. Your audio hardware and drivers process floating-point math slightly differently, producing a unique output.',
      mitigation: 'Brave blocks AudioContext fingerprinting by default. Firefox resistFingerprinting adds noise to the output.',
    };
  } catch (e) {
    return {
      name: 'AudioContext',
      category: 'hardware',
      value: 'blocked',
      displayValue: 'AudioContext blocked or unavailable',
      entropy: 1.0,
      description: 'AudioContext fingerprinting was blocked by your browser.',
    };
  }
}
