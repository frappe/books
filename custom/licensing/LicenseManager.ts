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
    console.log('Loaded cache:', cached ? {
      licenseKey: cached.licenseKey?.substring(0, 10) + '...',
      lastValidatedAt: cached.lastValidatedAt,
      gracePeriodEndsAt: cached.gracePeriodEndsAt,
    } : null);
    
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
      console.log('Attempting online license validation...');
      const onlineResult = await this.onlineValidator.validate(cached.licenseKey);
      
      // If online validation succeeded, return it
      if (onlineResult.isValid) {
        console.log('✅ Online validation successful - state:', onlineResult.state);
        return onlineResult;
      }
      
      // If online validation returned invalid (not network error), return that result
      console.log('❌ Online validation returned invalid license - state:', onlineResult.state);
      return onlineResult;
    } catch (error) {
      // Network error or API unavailable - fallback to offline validation
      console.log('⚠️  Online validation threw error (network issue):', error instanceof Error ? error.message : error);
      console.log('Falling back to offline validation...');
      
      // Use offline validation
      const offlineResult = await this.offlineValidator.validate();
      console.log('Offline validation result:');
      console.log('  - State:', offlineResult.state);
      console.log('  - Valid:', offlineResult.isValid);
      console.log('  - Days remaining:', offlineResult.daysRemaining);
      console.log('  - Grace period ends:', offlineResult.gracePeriodEndsAt);
      console.log('=== License Check Complete ===\n');
      
      return offlineResult;
    }
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
