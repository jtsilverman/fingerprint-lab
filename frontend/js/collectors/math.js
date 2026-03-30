/**
 * Math constant precision fingerprinting.
 * Different JS engines produce slightly different results for trig functions.
 */

import { sha256 } from '../hash.js';

export async function collectMath() {
  // These specific values produce different results across V8, SpiderMonkey, and JSC
  const values = {
    tan_m34: Math.tan(-1e300),
    sinh_1: Math.sinh(1),
    cosh_10: Math.cosh(10),
    tanh_big: Math.tanh(100),
    atan2: Math.atan2(1, 2),
    expm1: Math.expm1(1),
    log1p: Math.log1p(0.5),
    cbrt_2: Math.cbrt(2),
    acosh_1e12: Math.acosh(1e12),
    asinh_1: Math.asinh(1),
    atanh_half: Math.atanh(0.5),
    pow_special: Math.pow(Math.PI, -100),
  };

  const fingerprint = Object.entries(values).map(([k, v]) => `${k}:${v}`).join(',');
  const hash = await sha256(fingerprint);

  return {
    name: 'Math Precision',
    category: 'browser',
    value: values,
    displayValue: `tan(-1e300) = ${values.tan_m34}`,
    entropy: 2.0,
    description: 'Computes specific trigonometric and math functions and checks the floating-point precision. V8 (Chrome), SpiderMonkey (Firefox), and JavaScriptCore (Safari) use different math libraries that produce subtly different results for edge-case inputs.',
    mitigation: 'No practical mitigation. Math precision is fundamental to the JavaScript engine.',
  };
}
