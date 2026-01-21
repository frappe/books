/**
 * Offline Validator
 * Validates cached licenses with grace period enforcement
 */

import { LicenseValidationResult, LicenseState } from '../types';
import { loadLicenseCache } from '../cache/license-cache';
import { verifyDeviceId } from '../fingerprint/device-id';
import {
  determineGracePeriodState,
  getRemainingDays,
  isGracePeriodExpired,
} from './grace-period';

export class OfflineValidator {
  /**
   * Validate license using cached data
   */
  async validate(): Promise<LicenseValidationResult> {
    try {
      const cached = loadLicenseCache();

      if (!cached) {
        return {
          state: LicenseState.UNLICENSED,
          isValid: false,
          error: 'No cached license found',
          lastValidatedAt: new Date(),
          validatedOnline: false,
        };
      }

      // Verify device ID matches
      if (!verifyDeviceId(cached.hostId)) {
        return {
          state: LicenseState.INVALID,
          isValid: false,
          error: 'License bound to different device',
          lastValidatedAt: new Date(),
          validatedOnline: false,
        };
      }

      const gracePeriodEndsAt = new Date(cached.gracePeriodEndsAt);
      const lastValidatedAt = new Date(cached.lastValidatedAt);

      // Check if subscription expired (if applicable)
      if (cached.expiresAt) {
        const expiresAt = new Date(cached.expiresAt);
        if (new Date() > expiresAt) {
          return {
            state: LicenseState.EXPIRED,
            isValid: false,
            error: 'License subscription has expired',
            expiresAt,
            lastValidatedAt,
            validatedOnline: false,
          };
        }
      }

      // Check grace period
      if (isGracePeriodExpired(gracePeriodEndsAt)) {
        return {
          state: LicenseState.GRACE_EXPIRED,
          isValid: false,
          error: 'Offline grace period expired - please connect to internet',
          gracePeriodEndsAt,
          daysRemaining: 0,
          lastValidatedAt,
          validatedOnline: false,
        };
      }

      // Determine state based on grace period
      const state = determineGracePeriodState(gracePeriodEndsAt, false);
      const daysRemaining = getRemainingDays(gracePeriodEndsAt);

      return {
        state,
        isValid: true,
        licenseKey: cached.licenseKey,
        licenseeEmail: cached.licenseeEmail,
        licenseeName: cached.licenseeName,
        expiresAt: cached.expiresAt ? new Date(cached.expiresAt) : undefined,
        gracePeriodEndsAt,
        daysRemaining,
        lastValidatedAt,
        validatedOnline: false,
      };
    } catch (error) {
      console.error('Offline validation failed:', error);
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
