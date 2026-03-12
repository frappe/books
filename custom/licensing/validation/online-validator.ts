/**
 * Online Validator
 * Handles online license activation and validation via keymint.dev
 */

import { KeymintClient } from '../api/keymint-client';
import { LicenseConfig, LicenseValidationResult, LicenseState, LicenseCacheData } from '../types';
import { getDeviceId } from '../fingerprint/device-id';
import { saveLicenseCache } from '../cache/license-cache';
import { calculateGracePeriodEnd } from './grace-period';

export class OnlineValidator {
  private client: KeymintClient;
  private config: LicenseConfig;

  constructor(config: LicenseConfig) {
    this.config = config;
    this.client = new KeymintClient(
      config.apiUrl,
      config.accessToken,
      config.validationTimeout
    );
  }

  /**
   * Activate a license key (first-time setup)
   */
  async activate(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      const hostId = getDeviceId();
      
      const response = await this.client.activate({
        productId: this.config.productId,
        licenseKey,
        hostId,
      });

      console.log('Keymint activation response:', JSON.stringify(response, null, 2));

      if (response.code !== 0) {
        return {
          state: LicenseState.INVALID,
          isValid: false,
          error: response.message || 'Activation failed',
          lastValidatedAt: new Date(),
          validatedOnline: true,
        };
      }

      // Cache the successful activation
      const now = new Date();
      const gracePeriodEndsAt = calculateGracePeriodEnd(now, this.config.gracePeriodDays);

      const cacheData: LicenseCacheData = {
        licenseKey,
        productId: this.config.productId,
        hostId,
        customerId: response.customerId || response.customer_id,
        licenseeEmail: response.licensee_email,
        licenseeName: response.licensee_name,
        expiresAt: response.expires_at,
        activatedAt: now.toISOString(),
        lastValidatedAt: now.toISOString(),
        gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
        apiResponseHash: '', // Will be set by cache manager
      };

      saveLicenseCache(cacheData);

      return {
        state: LicenseState.ACTIVE_ONLINE,
        isValid: true,
        licenseKey,
        licenseeEmail: response.licensee_email,
        licenseeName: response.licensee_name,
        expiresAt: response.expires_at ? new Date(response.expires_at) : undefined,
        gracePeriodEndsAt,
        lastValidatedAt: now,
        validatedOnline: true,
      };
    } catch (error) {
      console.error('Online activation failed:', error);
      return {
        state: LicenseState.INVALID,
        isValid: false,
        error: error instanceof Error ? error.message : 'Activation failed',
        lastValidatedAt: new Date(),
        validatedOnline: false,
      };
    }
  }

  /**
   * Validate an existing license online
   */
  async validate(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      const hostId = getDeviceId();

      const response = await this.client.validate({
        productId: this.config.productId,
        licenseKey,
        hostId,
      });

      console.log('Keymint validation response:', JSON.stringify(response, null, 2));
      
      // Extract data from nested structure
      // GET /key returns: { data: { license: { expirationDate }, customer: { id, name, email } }, code: 0 }
      const responseData = (response as any).data;
      const customerData = responseData?.customer;
      const licenseData = responseData?.license;
      
      const customerId = customerData?.id;
      const licenseeName = customerData?.name || response.licensee_name;
      const licenseeEmail = customerData?.email || response.licensee_email;
      const expirationDate = licenseData?.expirationDate || response.expires_at;
      
      console.log('Extracted customer_id:', customerId);
      console.log('Extracted licensee_name:', licenseeName);
      console.log('Extracted licensee_email:', licenseeEmail);
      console.log('Extracted expirationDate:', expirationDate);

      if (response.code !== 0) {
        return {
          state: LicenseState.INVALID,
          isValid: false,
          error: response.message || 'Validation failed',
          lastValidatedAt: new Date(),
          validatedOnline: true,
        };
      }

      // Check if license has expired (for subscription-based licenses)
      const now = new Date();
      if (expirationDate) {
        const expiresAt = new Date(expirationDate);
        // Use >= to catch exact expiration moment
        // If expiresAt is "2026-03-08T23:59:59.999Z", it expires at the END of that day
        if (now >= expiresAt) {
          console.log('License has expired. Expiration date:', expiresAt);
          console.log('Current time:', now);
          return {
            state: LicenseState.EXPIRED,
            isValid: false,
            error: 'License subscription has expired',
            expiresAt,
            lastValidatedAt: now,
            validatedOnline: true,
            licenseeEmail,
            licenseeName,
          };
        }
      }

      // Update cache with fresh validation
      const gracePeriodEndsAt = calculateGracePeriodEnd(now, this.config.gracePeriodDays);

      const cacheData: LicenseCacheData = {
        licenseKey,
        productId: this.config.productId,
        hostId,
        customerId,
        licenseeEmail,
        licenseeName,
        expiresAt: expirationDate,
        activatedAt: now.toISOString(), // Keep original if exists
        lastValidatedAt: now.toISOString(),
        gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
        apiResponseHash: '',
      };

      saveLicenseCache(cacheData);

      return {
        state: LicenseState.ACTIVE_ONLINE,
        isValid: true,
        licenseKey,
        licenseeEmail,
        licenseeName,
        expiresAt: expirationDate ? new Date(expirationDate) : undefined,
        gracePeriodEndsAt,
        lastValidatedAt: now,
        validatedOnline: true,
      };
    } catch (error) {
      // Re-throw the error so LicenseManager can fallback to offline validation
      console.error('Online validation failed (will fallback to offline):', error);
      throw error;
    }
  }
}
