/**
 * AES-256-GCM encrypt/decrypt for tenant_projects.connection_string.
 *
 * Desktop's equivalent (custom/licensing/cache/encryption.ts) uses Node's
 * `crypto` module and a key derived from a hardcoded seed string. Neither
 * carries over here: Cloudflare Workers doesn't run Node's `crypto` (this
 * uses the Web Crypto API, `crypto.subtle`, instead), and a connection
 * string is a live production secret, not a local license cache, so the
 * key comes from a dedicated Worker secret rather than a seed in source.
 * That key-source decision was missing from the spec and was persisted
 * into it during /develop on 2026-09-03 — see docs/specs/0001, Value
 * sourcing and Configuration required.
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md
 */

const IV_LENGTH_BYTES = 12; // 96-bit IV, standard for AES-GCM

async function importKey(rawKey: string): Promise<CryptoKey> {
  // TENANT_ENCRYPTION_KEY is stored as a base64-encoded 32-byte value.
  const keyBytes = Uint8Array.from(atob(rawKey), (c) => c.charCodeAt(0));
  if (keyBytes.length !== 32) {
    throw new Error(
      `TENANT_ENCRYPTION_KEY must decode to 32 bytes for AES-256-GCM, got ${keyBytes.length}`
    );
  }
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/** Returns base64(iv || ciphertext), safe to store in a single text column. */
export async function encrypt(plaintext: string, rawKey: string): Promise<string> {
  const key = await importKey(rawKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encoded: string, rawKey: string): Promise<string> {
  const key = await importKey(rawKey);
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH_BYTES);
  const ciphertext = combined.slice(IV_LENGTH_BYTES);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}
