/**
 * Backend API client for fingerprint comparison.
 */

const API_BASE = 'https://fingerprint-lab-api.up.railway.app';

export async function submitFingerprint(hash, vectors) {
  try {
    const resp = await fetch(`${API_BASE}/api/fingerprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash, vectors }),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export async function getStats() {
  try {
    const resp = await fetch(`${API_BASE}/api/stats`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}
