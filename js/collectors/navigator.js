/**
 * Navigator property fingerprinting.
 * Collects browser-exposed device and browser properties.
 */

import { sha256 } from '../hash.js';

export async function collectNavigator() {
  const data = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    deviceMemory: navigator.deviceMemory || 'unknown',
    languages: Array.from(navigator.languages || []),
    maxTouchPoints: navigator.maxTouchPoints || 0,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    webdriver: navigator.webdriver || false,
    pdfViewerEnabled: navigator.pdfViewerEnabled,
    vendor: navigator.vendor,
  };

  const hash = await sha256(JSON.stringify(data));

  return {
    name: 'Navigator',
    category: 'browser',
    value: data,
    displayValue: `${data.hardwareConcurrency} cores, ${data.deviceMemory || '?'}GB RAM, ${data.languages[0] || '?'}`,
    entropy: 10.2,
    description: 'Reads properties your browser freely shares with every website: CPU cores, RAM, language, touch support, and more. The combination is surprisingly unique.',
    mitigation: 'Firefox resistFingerprinting spoofs many navigator properties. Tor Browser standardizes these values.',
  };
}
