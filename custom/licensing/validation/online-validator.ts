/**
 * Online Validator
 * Handles online license activation and validation via keymint.dev
 */

import { KeymintClient, KeymintApiError } from '../api/keymint-client';
import { LicenseConfig, LicenseValidationResult, LicenseState, LicenseCacheData } from '../types';
import { getDeviceId } from '../fingerprint/device-id';
import { saveLicenseCache } from '../cache/license-cache';
import { calculateGracePeriodEnd } from './grace-period';
import { generateDeviceTag } from 'utils/device-tag';

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
      const deviceTag = generateDeviceTag();

      const response = await this.client.activate({
        productId: this.config.productId,
        licenseKey,
        hostId,
        deviceTag,
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
        deviceTag,
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
   * Validate an existing license online.
   *
   * Uses POST /key/activate (idempotent) instead of GET /key, because only
   * /key/activate is host-aware. Re-activating an already-authorized hostId
   * is a no-op server-side and does not consume a new seat — but if this
   * hostId was removed from allowedHosts (deactivated remotely, or the
   * license's activation limit was lowered), the server returns code 3 and
   * we must block the rest of the app.
   */
  async validate(licenseKey: string): Promise<LicenseValidationResult> {
    const hostId = getDeviceId();

    try {
      const response = await this.client.activate({
        productId: this.config.productId,
        licenseKey,
        hostId,
      });

      console.log('Keymint re-activation (validation) response:', JSON.stringify(response, null, 2));

      const now = new Date();
      const gracePeriodEndsAt = calculateGracePeriodEnd(now, this.config.gracePeriodDays);

      const cacheData: LicenseCacheData = {
        licenseKey,
        productId: this.config.productId,
        hostId,
        customerId: response.customerId || response.customer_id,
        licenseeEmail: response.licenseeEmail || response.licensee_email,
        licenseeName: response.licenseeName || response.licensee_name,
        expiresAt: response.expires_at,
        activatedAt: now.toISOString(),
        lastValidatedAt: now.toISOString(),
        gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
        apiResponseHash: '',
      };

      saveLicenseCache(cacheData);

      return {
        state: LicenseState.ACTIVE_ONLINE,
        isValid: true,
        licenseKey,
        licenseeEmail: response.licenseeEmail || response.licensee_email,
        licenseeName: response.licenseeName || response.licensee_name,
        expiresAt: response.expires_at ? new Date(response.expires_at) : undefined,
        gracePeriodEndsAt,
        lastValidatedAt: now,
        validatedOnline: true,
      };
    } catch (error) {
      // Host explicitly unauthorized — this is the case you asked about.
      // Do NOT fall back to offline validation here: offline fallback exists
      // for network problems, not for "the server told us this device is
      // no longer allowed." Falling back would let the deactivated device
      // keep using the cached grace period.
      if (error instanceof KeymintApiError && error.code === 3) {
        console.log(`Device hostId ${hostId} is no longer authorized (code 3).`);
        return {
          state: LicenseState.DEVICE_DEACTIVATED,
          isValid: false,
          error: 'This device is no longer authorized on this license. Please reactivate or contact support.',
          lastValidatedAt: new Date(),
          validatedOnline: true,
        };
      }

      // License-level problem: expired, blocked, or activation limit reached.
      if (error instanceof KeymintApiError && error.code === 2) {
        return {
          state: LicenseState.EXPIRED,
          isValid: false,
          error: error.message || 'License expired, blocked, or activation limit reached',
          lastValidatedAt: new Date(),
          validatedOnline: true,
        };
      }

      // Anything else (network error, timeout, 5xx) — genuinely unknown,
      // let LicenseManager fall back to offline/grace-period validation.
      console.error('Online validation failed (will fallback to offline):', error);
      throw error;
    }
  }
}

