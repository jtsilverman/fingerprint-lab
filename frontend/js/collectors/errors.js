/**
 * Error message fingerprinting.
 * Different JS engines format error messages differently.
 */

import { sha256 } from '../hash.js';

export async function collectErrors() {
  const messages = {};

  // Each engine formats these errors differently
  try { null.property; } catch (e) { messages.null_access = e.message; }
  try { undefined.property; } catch (e) { messages.undefined_access = e.message; }
  try { eval('/[/'); } catch (e) { messages.invalid_regex = e.message; }
  try { new Array(-1); } catch (e) { messages.invalid_array = e.message; }
  try { eval('{'); } catch (e) { messages.syntax = e.message; }
  try { decodeURIComponent('%'); } catch (e) { messages.uri = e.message; }
  try { 1n + 1; } catch (e) { messages.bigint_mix = e.message; }

  const fingerprint = Object.entries(messages).map(([k, v]) => `${k}:${v}`).join('|');
  const hash = await sha256(fingerprint);

  // Detect engine from error patterns
  let engine = 'Unknown';
  if (messages.null_access?.includes('Cannot read properties')) engine = 'V8 (Chrome/Edge)';
  else if (messages.null_access?.includes('is null')) engine = 'SpiderMonkey (Firefox)';
  else if (messages.null_access?.includes('is not an object')) engine = 'JavaScriptCore (Safari)';

  return {
    name: 'Error Messages',
    category: 'browser',
    value: messages,
    displayValue: `Engine: ${engine}`,
    entropy: 2.2,
    description: 'Triggers specific JavaScript errors and captures the error message format. V8 says "Cannot read properties of null", SpiderMonkey says "null is null", JSC says "null is not an object". The exact wording reveals the JS engine and sometimes the version.',
    mitigation: 'No practical mitigation. Error messages are part of the engine internals.',
  };
}
