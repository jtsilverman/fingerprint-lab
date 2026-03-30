/**
 * SHA-256 hashing via SubtleCrypto.
 */

export async function sha256(input) {
  const data = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  const array = Array.from(new Uint8Array(buffer));
  return array.map(b => b.toString(16).padStart(2, '0')).join('');
}
