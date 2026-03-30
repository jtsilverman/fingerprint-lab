/**
 * V8 DevTools detection via ECMAScript Proxy spec compliance.
 *
 * Exploits the fact that when Chrome DevTools Protocol's Runtime domain
 * is enabled, V8's Inspector performs full serialization on all console.*
 * arguments. This walks prototype chains, and when it hits a Proxy with
 * an ownKeys trap, the ECMAScript spec REQUIRES the trap to be invoked.
 *
 * The detection is Chrome/Edge (V8) specific.
 */

export async function collectDevtools() {
  let detected = false;
  let applicable = true;

  // Check if we're on a V8-based browser
  const isV8 = /Chrome|Chromium|Edg/.test(navigator.userAgent)
    && !/Firefox|Safari\/(?!.*Chrome)/.test(navigator.userAgent);

  if (!isV8) {
    applicable = false;
  }

  if (applicable) {
    // Create a Proxy with an ownKeys trap as the prototype
    const trap = new Proxy({}, {
      ownKeys() {
        detected = true;
        return [];
      },
    });

    // Create a plain object whose prototype is the trap Proxy
    const obj = Object.create(trap);

    // console.groupEnd triggers Inspector serialization when DevTools is active.
    // The Inspector checks if the value is a Proxy (it's not, it's a plain object).
    // But it walks the prototype chain for key collection and hits our Proxy.
    // The ECMAScript spec mandates calling the ownKeys trap.
    console.groupEnd(obj);
  }

  const value = !applicable ? 'not applicable (non-V8 browser)' : detected ? 'detected' : 'not detected';

  return {
    name: 'DevTools Detection',
    category: 'security',
    value: value,
    displayValue: value,
    entropy: 1.0,
    description: applicable
      ? 'Exploits a V8 spec compliance behavior: when DevTools is open, Chrome\'s Inspector serializes all console.* arguments. It walks prototype chains and hits a Proxy with an ownKeys trap. The ECMAScript spec requires V8 to invoke the trap, leaking that DevTools is active. This is a 5-layer interaction: (1) Inspector serializes arguments unconditionally, (2) surface-level Proxy check passes because the object itself isn\'t a Proxy, (3) prototype chain traversal reaches the Proxy, (4) key accumulation triggers on the Proxy, (5) spec-mandated trap invocation. No single line is wrong. The vulnerability is the intersection of three design decisions: unconditional preview serialization, incomplete Proxy guards, and eager key accumulation.'
      : 'This technique only works on V8-based browsers (Chrome, Edge, Chromium). Your browser uses a different JavaScript engine.',
    mitigation: 'There is no user-side mitigation. This is a browser engine behavior mandated by the ECMAScript specification. Chrome would need to change their Inspector implementation.',
  };
}
