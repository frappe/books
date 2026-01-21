/**
 * License Cache Management
 * Handles encrypted storage and retrieval of license data
 */

import Store = require('electron-store');
import { LicenseCacheData } from '../types';
import { encrypt, decrypt, generateHmac, verifyHmac } from './encryption';

interface EncryptedCache {
  encrypted: string;
  iv: string;
  authTag: string;
}

const store = new Store<{ licenseCache?: EncryptedCache }>({
  name: 'license-cache',
  encryptionKey: 'rarebooks-license-v1', // Additional layer
});

/**
 * Save license data to encrypted cache
 */
export function saveLicenseCache(data: LicenseCacheData): void {
  try {
    const json = JSON.stringify(data);
    const hash = generateHmac(json);
    
    // Add hash to data for integrity check
    const dataWithHash = { ...data, apiResponseHash: hash };
    
    // Encrypt the data
    const encrypted = encrypt(JSON.stringify(dataWithHash));
    
    // Store encrypted data
    store.set('licenseCache', encrypted);
  } catch (error) {
    console.error('Failed to save license cache:', error);
    throw new Error('Failed to cache license data');
  }
}

/**
 * Load license data from encrypted cache
 */
export function loadLicenseCache(): LicenseCacheData | null {
  try {
    const cached = store.get('licenseCache');
    
    if (!cached) {
      return null;
    }

    // Decrypt the data
    const decrypted = decrypt(cached.encrypted, cached.iv, cached.authTag);
    const data = JSON.parse(decrypted) as LicenseCacheData;

    // Verify integrity
    const { apiResponseHash, ...dataWithoutHash } = data;
    const expectedHash = generateHmac(JSON.stringify(dataWithoutHash));
    
    if (!verifyHmac(JSON.stringify(dataWithoutHash), apiResponseHash)) {
      console.error('Cache integrity check failed');
      clearLicenseCache();
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load license cache:', error);
    return null;
  }
}

/**
 * Clear license cache
 */
export function clearLicenseCache(): void {
  store.delete('licenseCache');
}

/**
 * Check if cache exists
 */
export function hasCachedLicense(): boolean {
  return store.has('licenseCache');
}
