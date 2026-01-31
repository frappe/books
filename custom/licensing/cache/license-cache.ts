/**
 * License Cache Management
 * Handles encrypted storage and retrieval of license data
 */

import Store = require('electron-store');
import { LicenseCacheData } from '../types';
import { encrypt, decrypt, generateHmac, verifyHmac } from './encryption';

/**
 * Sort object keys recursively to ensure consistent JSON serialization
 */
function sortKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  
  const sorted: any = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortKeys(obj[key]);
  });
  return sorted;
}

/**
 * Remove undefined values from object to ensure consistent JSON serialization
 * (JSON.stringify omits undefined values)
 */
function removeUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter(v => v !== undefined);
  }
  
  const result: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      result[key] = removeUndefined(value);
    }
  });
  return result;
}

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
    // Remove apiResponseHash and undefined values before hashing
    const { apiResponseHash: _, ...dataWithoutHash } = data as any;
    const cleanedData = removeUndefined(dataWithoutHash);
    const sortedData = sortKeys(cleanedData);
    const json = JSON.stringify(sortedData);
    const hash = generateHmac(json);
    
    // Add hash to data for integrity check
    const dataWithHash = { ...sortedData, apiResponseHash: hash };
    
    // Encrypt the data
    const encrypted = encrypt(JSON.stringify(dataWithHash));
    
    // Store encrypted data
    store.set('licenseCache', encrypted);
  } catch (error) {
    console.error('❌ Failed to save license cache:', error);
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
    const { apiResponseHash, ...dataWithoutHash } = data as any;
    const cleanedData = removeUndefined(dataWithoutHash);
    const sortedData = sortKeys(cleanedData);
    const json = JSON.stringify(sortedData);
    
    if (!verifyHmac(json, apiResponseHash)) {
      console.error('License cache integrity check failed');
      clearLicenseCache();
      return null;
    }
    
    return dataWithoutHash;
  } catch (error) {
    console.error('Failed to load license cache:', error);
    clearLicenseCache();
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
