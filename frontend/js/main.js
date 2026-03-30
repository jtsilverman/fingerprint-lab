/**
 * App initialization and orchestration.
 */

import { sha256 } from './hash.js';
import { hideLoading, showFingerprint, showScore, renderResults } from './ui.js';

// Collectors will be imported as they're built
const collectors = [];

export function registerCollector(fn) {
  collectors.push(fn);
}

async function run() {
  const results = await Promise.all(collectors.map(fn => {
    try {
      return fn();
    } catch (e) {
      return Promise.resolve({
        name: 'Error',
        category: 'browser',
        value: e.message,
        displayValue: 'Error: ' + e.message,
      });
    }
  }));

  // Compute combined fingerprint hash
  const combined = results.map(r => {
    const val = typeof r.value === 'object' ? JSON.stringify(r.value) : String(r.value);
    return `${r.name}:${val}`;
  }).join('|');
  const hash = await sha256(combined);

  // Calculate total entropy
  const totalEntropy = results.reduce((sum, r) => sum + (r.entropy || 0), 0);

  hideLoading();
  showFingerprint(hash);
  showScore(totalEntropy);
  renderResults(results);

  // Export button
  document.getElementById('export-btn').addEventListener('click', () => {
    const data = {
      fingerprint: hash,
      totalEntropy,
      vectors: results.map(r => ({
        name: r.name,
        category: r.category,
        value: r.value,
        entropy: r.entropy,
      })),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fingerprint.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
