/**
 * Media devices fingerprinting.
 * Enumerates available audio/video devices without requesting permissions.
 */

import { sha256 } from '../hash.js';

export async function collectMedia() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return {
      name: 'Media Devices',
      category: 'hardware',
      value: 'not supported',
      displayValue: 'Media devices API not available',
      entropy: 0.5,
      description: 'Media devices enumeration is not supported.',
    };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const summary = {
      audioinput: 0,
      audiooutput: 0,
      videoinput: 0,
    };

    for (const d of devices) {
      if (summary[d.kind] !== undefined) {
        summary[d.kind]++;
      }
    }

    const hash = await sha256(JSON.stringify(summary));

    return {
      name: 'Media Devices',
      category: 'hardware',
      value: summary,
      displayValue: `${summary.audioinput} mic, ${summary.audiooutput} speaker, ${summary.videoinput} camera`,
      entropy: 2.8,
      description: 'Counts your audio inputs (microphones), audio outputs (speakers/headphones), and video inputs (cameras) without requesting permission to use them. The device count varies by hardware setup.',
      mitigation: 'Firefox resistFingerprinting reports a single device of each type.',
    };
  } catch (e) {
    return {
      name: 'Media Devices',
      category: 'hardware',
      value: 'blocked',
      displayValue: 'Blocked',
      entropy: 0.5,
      description: 'Media device enumeration was blocked.',
    };
  }
}
