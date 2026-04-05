/**
 * Tests for js/hash.js SHA-256 function.
 * Run: node test/hash.test.mjs
 */

import { sha256 } from '../js/hash.js';
import { strict as assert } from 'node:assert';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL: ${name} - ${e.message}`);
    failed++;
  }
}

console.log('hash.js tests\n');

await test('produces a 64-char hex string', async () => {
  const result = await sha256('hello');
  assert.equal(result.length, 64);
  assert.match(result, /^[0-9a-f]{64}$/);
});

await test('matches known SHA-256 for "hello"', async () => {
  // SHA-256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
  const result = await sha256('hello');
  assert.equal(result, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});

await test('produces consistent output', async () => {
  const a = await sha256('test input');
  const b = await sha256('test input');
  assert.equal(a, b);
});

await test('different inputs produce different hashes', async () => {
  const a = await sha256('input A');
  const b = await sha256('input B');
  assert.notEqual(a, b);
});

await test('handles empty string', async () => {
  // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  const result = await sha256('');
  assert.equal(result, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
