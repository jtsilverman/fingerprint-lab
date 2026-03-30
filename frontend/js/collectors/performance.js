/**
 * Performance timing precision fingerprinting.
 * Browsers reduce timer precision for privacy. The precision itself is a fingerprint.
 */

export async function collectPerformance() {
  // Measure performance.now() precision by collecting samples
  const samples = [];
  let lastTime = performance.now();

  for (let i = 0; i < 100; i++) {
    const now = performance.now();
    const diff = now - lastTime;
    if (diff > 0) {
      samples.push(diff);
    }
    lastTime = now;
  }

  // Find the minimum non-zero difference (this is the timer precision)
  const minDiff = samples.length > 0 ? Math.min(...samples.filter(s => s > 0)) : 0;

  // Round to nearest common precision level
  let precision;
  if (minDiff < 0.01) precision = 'sub-microsecond';
  else if (minDiff < 0.1) precision = '100us';
  else if (minDiff <= 1) precision = '1ms';
  else if (minDiff <= 5) precision = '5ms (reduced)';
  else if (minDiff <= 20) precision = '20ms (heavily reduced)';
  else precision = `${Math.round(minDiff)}ms (custom)`;

  return {
    name: 'Timer Precision',
    category: 'browser',
    value: { precision, minDiff: parseFloat(minDiff.toFixed(4)), sampleCount: samples.length },
    displayValue: `${precision} (${minDiff.toFixed(3)}ms)`,
    entropy: 2.5,
    description: 'Measures the precision of performance.now(). Browsers reduce timer precision to prevent timing attacks (Spectre). Chrome defaults to 5us, Firefox to 1ms (20ms in cross-origin iframes). The precision level reveals your browser and privacy settings.',
    mitigation: 'Firefox resistFingerprinting reduces precision to 20ms. This is already a privacy measure.',
  };
}
