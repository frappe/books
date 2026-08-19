/**
 * Custom Licensing Module - Main Export
 * Hybrid online/offline licensing using keymint.dev
 */

import { LicenseManager } from './LicenseManager';
import { LicenseConfig } from './types';
import { SubscriptionManager } from './subscription/subscription-manager';
import { SubscriptionConfig } from './subscription/types';

// Export types and classes
export * from './types';
export { LicenseManager } from './LicenseManager';
export * from './subscription/types';
export { SubscriptionManager } from './subscription/subscription-manager';

// Configuration from environment variables
const config: LicenseConfig = {
  apiUrl: process.env.KEYMINT_API_URL || 'https://api.keymint.dev',
  accessToken: process.env.KEYMINT_ACCESS_TOKEN || '',
  productId: process.env.KEYMINT_PRODUCT_ID || '',
  gracePeriodDays: 7,
  validationTimeout: 10000,
  backgroundCheckInterval: 3600000, // 1 hour
};

// Subscription configuration
const subscriptionConfig: SubscriptionConfig = {
  clickpesaApiUrl: process.env.CLICKPESA_API_URL || 'https://api.clickpesa.com',
  clickpesaClientId: process.env.CLICKPESA_CLIENT_ID || '',
  clickpesaApiKey: process.env.CLICKPESA_API_KEY || '',
  clickpesaChecksumKey: process.env.CLICKPESA_CHECKSUM_KEY || '',
  yearlyLicensePrice: parseFloat(process.env.YEARLY_LICENSE_PRICE || '500000'), // 500,000 TZS default
  paymentTimeout: 30000, // 30 seconds
};

// Debug: Log config (with sensitive data masked)
console.log('Licensing config loaded:', {
  apiUrl: config.apiUrl,
  accessToken: config.accessToken ? `${config.accessToken.substring(0, 10)}...` : 'MISSING',
  productId: config.productId || 'MISSING',
  productIdLength: config.productId.length,
});

// Warn if credentials are missing
if (!config.accessToken || !config.productId) {
  console.warn('⚠️  License credentials not configured. Set KEYMINT_ACCESS_TOKEN and KEYMINT_PRODUCT_ID environment variables.');
  console.warn('⚠️  Licensing features will be disabled.');
}

// Singleton instances
let licenseManagerInstance: LicenseManager | null = null;
let subscriptionManagerInstance: SubscriptionManager | null = null;

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
 * Get or create SubscriptionManager singleton instance
 */
export function getSubscriptionManager(): SubscriptionManager {
  if (!subscriptionManagerInstance) {
    subscriptionManagerInstance = new SubscriptionManager(config, subscriptionConfig);
  }
  return subscriptionManagerInstance;
}

/**
 * Initialize licensing system
 */
export async function initializeLicensing() {
  const manager = getLicenseManager();
  return await manager.initialize();
}

/**
 * Default singleton instance for convenience
 */
export const licenseManager = getLicenseManager();
