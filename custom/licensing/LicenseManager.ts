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

  constructor(config: LicenseConfig) {
    this.config = config;
    this.onlineValidator = new OnlineValidator(config);
    this.offlineValidator = new OfflineValidator();
  }

  /**
   * Initialize license manager - check license on startup
   */
  async initialize(): Promise<LicenseValidationResult> {
    const result = await this.checkLicense();
    this.currentState = result;
    
    // Start background validation if license is valid
    if (result.isValid) {
      this.startBackgroundValidation();
    }
    
    return result;
  }

  /**
   * Activate a new license key
   */
  async activateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    const result = await this.onlineValidator.activate(licenseKey);
    this.currentState = result;
    
    if (result.isValid) {
      this.startBackgroundValidation();
    }
    
    return result;
  }

  /**
   * Check license (try online first, fallback to offline)
   */
  async checkLicense(): Promise<LicenseValidationResult> {
    // Try online validation first if we have a cached license
    if (hasCachedLicense()) {
      const cached = loadLicenseCache();
      
      if (cached) {
        try {
          const onlineResult = await this.onlineValidator.validate(cached.licenseKey);
          
          if (onlineResult.isValid) {
            return onlineResult;
          }
        } catch (error) {
          console.log('Online validation unavailable, using offline mode');
        }
      }
      
      // Fallback to offline validation
      return await this.offlineValidator.validate();
    }

    return {
      state: LicenseState.UNLICENSED,
      isValid: false,
      error: 'No license found',
      lastValidatedAt: new Date(),
      validatedOnline: false,
    };
  }

  /**
   * Get current license state
   */
  getCurrentState(): LicenseValidationResult | null {
    return this.currentState;
  }

  /**
   * Clear license and deactivate
   */
  async clearLicense(): Promise<void> {
    this.stopBackgroundValidation();
    clearLicenseCache();
    this.currentState = null;
  }

  /**
   * Start background validation (periodic online checks)
   */
  private startBackgroundValidation(): void {
    if (this.backgroundCheckTimer) {
      return; // Already running
    }

    this.backgroundCheckTimer = setInterval(async () => {
      try {
        const cached = loadLicenseCache();
        if (cached) {
          await this.onlineValidator.validate(cached.licenseKey);
        }
      } catch (error) {
        console.log('Background validation failed:', error);
      }
    }, this.config.backgroundCheckInterval);
  }

  /**
   * Stop background validation
   */
  private stopBackgroundValidation(): void {
    if (this.backgroundCheckTimer) {
      clearInterval(this.backgroundCheckTimer);
      this.backgroundCheckTimer = null;
    }
  }

  /**
   * Shutdown - cleanup resources
   */
  shutdown(): void {
    this.stopBackgroundValidation();
  }
}
