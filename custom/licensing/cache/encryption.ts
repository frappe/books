/**
 * Encryption Utilities - License Cache Protection
 * AES-256-GCM encryption with HMAC integrity verification
 */

import { createCipheriv, createDecipheriv, createHmac, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16;

// Store key in memory (will regenerate on app restart)
// This is acceptable for cache encryption as cache is validated on load
let encryptionKey: Buffer | null = null;

/**
 * Get or create encryption key
 */
export function getEncryptionKey(): Buffer {
  if (!encryptionKey) {
    // Generate a consistent key based on a fixed seed for this app
    // This allows decryption across sessions
    // Using a hash of a constant string to derive the key
    const seed = 'rarebooks-license-encryption-key-v1-2026';
    encryptionKey = createHash('sha256').update(seed).digest();
  }
  return encryptionKey;
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(plaintext: string): { encrypted: string; iv: string; authTag: string } {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encrypted: string, iv: string, authTag: string): string {
  try {
    const key = getEncryptionKey();
    
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed - data may be tampered or corrupted');
  }
}

/**
 * Generate HMAC for integrity verification
 */
export function generateHmac(data: string): string {
  const key = getEncryptionKey();
  return createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Verify HMAC integrity
 */
export function verifyHmac(data: string, hmac: string): boolean {
  const expected = generateHmac(data);
  return expected === hmac;
}
