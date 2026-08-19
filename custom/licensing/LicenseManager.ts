/**
 * License Manager - Main Service
 * Orchestrates online/offline validation, state management, and background checks
 */

import { LicenseConfig, LicenseValidationResult, LicenseState } from './types';
import { OnlineValidator } from './validation/online-validator';
import { OfflineValidator } from './validation/offline-validator';
import { hasCachedLicense, clearLicenseCache, loadLicenseCache } from './cache/license-cache';

export class LicenseManager {
  private config: LicenseConfig;
  private onlineValidator: OnlineValidator;
  private offlineValidator: OfflineValidator;
  private backgroundCheckTimer: NodeJS.Timeout | null = null;
  private currentState: LicenseValidationResult | null = null;
  private onStateChange: ((state: LicenseValidationResult) => void) | null =
    null;

  constructor(config: LicenseConfig) {
    this.config = config;
    this.onlineValidator = new OnlineValidator(config);
    this.offlineValidator = new OfflineValidator();
  }

  /** Register a callback invoked whenever currentState changes (used to push to renderer). */
  setOnStateChange(callback: (state: LicenseValidationResult) => void): void {
    this.onStateChange = callback;
  }

  private setState(result: LicenseValidationResult): void {
    const wasValid = this.currentState?.isValid;
    this.currentState = result;
    // Notify on every check, but especially useful when validity flips
    if (this.onStateChange && (wasValid !== result.isValid || !wasValid)) {
      this.onStateChange(result);
    }
  }

  async initialize(): Promise<LicenseValidationResult> {
    const result = await this.checkLicense();
    this.setState(result);
    if (result.isValid) {
      this.startBackgroundValidation();
    }
    return result;
  }

  async activateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    const result = await this.onlineValidator.activate(licenseKey);
    this.setState(result);
    if (result.isValid) {
      this.startBackgroundValidation();
    }
    return result;
  }

  async checkLicense(): Promise<LicenseValidationResult> {
    console.log('\n=== License Check Started ===');

    // Check if we have a cached license
    const hasCached = hasCachedLicense();
    console.log('Has cached license:', hasCached);

    if (!hasCached) {
      console.log('No cached license found - returning UNLICENSED');
      return {
        state: LicenseState.UNLICENSED,
        isValid: false,
        error: 'No license found',
        lastValidatedAt: new Date(),
        validatedOnline: false,
      };
    }

    const cached = loadLicenseCache();
    console.log(
      'Loaded cache:',
      cached
        ? {
            licenseKey: cached.licenseKey?.substring(0, 10) + '...',
            lastValidatedAt: cached.lastValidatedAt,
            gracePeriodEndsAt: cached.gracePeriodEndsAt,
          }
        : null
    );

    if (!cached) {
      console.log('Failed to load cache - returning UNLICENSED');
      return {
        state: LicenseState.UNLICENSED,
        isValid: false,
        error: 'No license found',
        lastValidatedAt: new Date(),
        validatedOnline: false,
      };
    }

    // Try online validation first
    try {
      const onlineResult = await this.onlineValidator.validate(
        cached.licenseKey
      );
      this.setState(onlineResult);
      return onlineResult;
    } catch (error) {
      const offlineResult = await this.offlineValidator.validate();
      this.setState(offlineResult);
      return offlineResult;
    }
  }

  getCurrentState(): LicenseValidationResult | null {
    return this.currentState;
  }

  async clearLicense(): Promise<void> {
    this.stopBackgroundValidation();
    clearLicenseCache();
    this.currentState = null;
  }

  private startBackgroundValidation(): void {
    if (this.backgroundCheckTimer) return;

    this.backgroundCheckTimer = setInterval(async () => {
      try {
        const cached = loadLicenseCache();
        if (cached) {
          const result = await this.onlineValidator.validate(cached.licenseKey);
          this.setState(result); // <-- this was missing before; background checks were discarded
          if (!result.isValid) {
            this.stopBackgroundValidation();
          }
        }
      } catch (error) {
        console.log(
          'Background validation failed (network issue, keeping cached state):',
          error
        );
        // leave currentState as-is; a real network blip shouldn't lock the user out
      }
    }, this.config.backgroundCheckInterval);
  }

  private stopBackgroundValidation(): void {
    if (this.backgroundCheckTimer) {
      clearInterval(this.backgroundCheckTimer);
      this.backgroundCheckTimer = null;
    }
  }

  shutdown(): void {
    this.stopBackgroundValidation();
  }
}
