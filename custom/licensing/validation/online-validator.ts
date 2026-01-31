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

      if (response.code !== 0) {
        return {
          state: LicenseState.INVALID,
          isValid: false,
          error: response.message || 'Validation failed',
          lastValidatedAt: new Date(),
          validatedOnline: true,
        };
      }

      // Update cache with fresh validation
      const now = new Date();
      const gracePeriodEndsAt = calculateGracePeriodEnd(now, this.config.gracePeriodDays);

      const cacheData: LicenseCacheData = {
        licenseKey,
        productId: this.config.productId,
        hostId,
        licenseeEmail: response.licensee_email,
        licenseeName: response.licensee_name,
        expiresAt: response.expires_at,
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
        licenseeEmail: response.licensee_email,
        licenseeName: response.licensee_name,
        expiresAt: response.expires_at ? new Date(response.expires_at) : undefined,
        gracePeriodEndsAt,
        lastValidatedAt: now,
        validatedOnline: true,
      };
    } catch (error) {
      console.error('Online validation failed:', error);
      return {
        state: LicenseState.INVALID,
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        lastValidatedAt: new Date(),
        validatedOnline: false,
      };
    }
  }
}
