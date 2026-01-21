/**
 * Custom Licensing Module - Main Export
 * Hybrid online/offline licensing using keymint.dev
 */

import { LicenseManager } from './LicenseManager';
import { LicenseConfig } from './types';

// Export types and classes
export * from './types';
export { LicenseManager } from './LicenseManager';

// Configuration from environment variables
const config: LicenseConfig = {
  apiUrl: process.env.KEYMINT_API_URL || 'https://api.keymint.dev',
  accessToken: process.env.KEYMINT_ACCESS_TOKEN || '',
  productId: process.env.KEYMINT_PRODUCT_ID || '',
  gracePeriodDays: 7,
  validationTimeout: 10000,
  backgroundCheckInterval: 3600000, // 1 hour
};

// Singleton instance
let licenseManagerInstance: LicenseManager | null = null;

/**
 * Get or create LicenseManager singleton instance
 */
export function getLicenseManager(): LicenseManager {
  if (!licenseManagerInstance) {
    licenseManagerInstance = new LicenseManager(config);
  }
  return licenseManagerInstance;
}

/**
 * Initialize licensing system
 */
export async function initializeLicensing() {
  const manager = getLicenseManager();
  return await manager.initialize();
}
