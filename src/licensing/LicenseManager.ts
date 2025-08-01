import { machineId } from 'node-machine-id';
import * as crypto from 'crypto-js';
import { Fyo } from 'fyo';

export type LicenseTier = 'starter' | 'professional' | 'enterprise';

export interface LicenseInfo {
  tier: LicenseTier;
  isActive: boolean;
  expirationDate: Date;
  features: string[];
  limitations: {
    maxLocations: number;
    maxTransactions: number;
    hasAI: boolean;
    hasAPI: boolean;
    hasCustomBranding: boolean;
    supportLevel: 'email' | 'phone' | 'priority' | 'dedicated';
  };
  paymentInfo: {
    monthlyPrice: number;
    transactionFee: number;
    currency: string;
  };
}

export interface HardwareFingerprint {
  machineId: string;
  platform: string;
  architecture: string;
  timestamp: number;
  checksum: string;
}

export interface LicenseValidationResult {
  isValid: boolean;
  reason?: string;
  grace_period_days?: number;
  features_available: string[];
  restrictions: string[];
}

export class LicenseManager {
  private fyo: Fyo;
  private currentLicense: LicenseInfo | null = null;
  private fingerprint: HardwareFingerprint | null = null;
  private validationTimer: NodeJS.Timeout | null = null;
  
  // Encryption key for license verification (in production, this would be more secure)
  private readonly ENCRYPTION_KEY = 'UniPOS-License-Key-2024';
  
  constructor(fyo: Fyo) {
    this.fyo = fyo;
  }

  async initialize(): Promise<void> {
    console.log('Initializing License Manager...');
    
    try {
      await this.generateHardwareFingerprint();
      await this.loadStoredLicense();
      await this.validateCurrentLicense();
      
      // Start periodic validation (every 24 hours)
      this.startPeriodicValidation();
      
      console.log('License Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize License Manager:', error);
      throw error;
    }
  }

  private async generateHardwareFingerprint(): Promise<void> {
    try {
      const machineIdValue = await machineId();
      const platform = process.platform;
      const architecture = process.arch;
      const timestamp = Date.now();
      
      // Create checksum to detect tampering
      const dataToHash = `${machineIdValue}-${platform}-${architecture}-${timestamp}`;
      const checksum = crypto.SHA256(dataToHash).toString();
      
      this.fingerprint = {
        machineId: machineIdValue,
        platform,
        architecture,
        timestamp,
        checksum
      };
      
      console.log('Hardware fingerprint generated');
    } catch (error) {
      console.error('Error generating hardware fingerprint:', error);
      throw error;
    }
  }

  private async loadStoredLicense(): Promise<void> {
    try {
      // Try to load license from local storage
      const storedLicense = localStorage.getItem('unipos-license');
      
      if (storedLicense) {
        const decryptedLicense = this.decryptLicense(storedLicense);
        
        if (decryptedLicense && this.isLicenseFormatValid(decryptedLicense)) {
          this.currentLicense = decryptedLicense;
          console.log(`Loaded ${this.currentLicense.tier} license`);
        } else {
          console.warn('Stored license is invalid or corrupted');
          this.currentLicense = this.getTrialLicense();
        }
      } else {
        // No stored license, start with trial
        this.currentLicense = this.getTrialLicense();
        console.log('No stored license found, using trial license');
      }
    } catch (error) {
      console.error('Error loading stored license:', error);
      this.currentLicense = this.getTrialLicense();
    }
  }

  private decryptLicense(encryptedLicense: string): LicenseInfo | null {
    try {
      const decrypted = crypto.AES.decrypt(encryptedLicense, this.ENCRYPTION_KEY).toString(crypto.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt license:', error);
      return null;
    }
  }

  private isLicenseFormatValid(license: any): license is LicenseInfo {
    return (
      license &&
      typeof license.tier === 'string' &&
      ['starter', 'professional', 'enterprise'].includes(license.tier) &&
      typeof license.isActive === 'boolean' &&
      license.expirationDate &&
      Array.isArray(license.features) &&
      license.limitations &&
      license.paymentInfo
    );
  }

  private getTrialLicense(): LicenseInfo {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial
    
    return {
      tier: 'starter',
      isActive: true,
      expirationDate: trialEndDate,
      features: [
        'basic_pos',
        'inventory_management',
        'basic_reporting',
        'single_location',
        'email_support'
      ],
      limitations: {
        maxLocations: 1,
        maxTransactions: 1000,
        hasAI: false,
        hasAPI: false,
        hasCustomBranding: false,
        supportLevel: 'email'
      },
      paymentInfo: {
        monthlyPrice: 0, // Trial is free
        transactionFee: 0.029, // 2.9% + $0.30
        currency: 'USD'
      }
    };
  }

  async validateCurrentLicense(): Promise<LicenseValidationResult> {
    if (!this.currentLicense) {
      return {
        isValid: false,
        reason: 'No license found',
        features_available: [],
        restrictions: ['All features disabled']
      };
    }

    // Check expiration
    const now = new Date();
    const expired = now > this.currentLicense.expirationDate;
    
    if (expired) {
      const daysExpired = Math.floor((now.getTime() - this.currentLicense.expirationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysExpired <= 7) {
        // Grace period of 7 days
        return {
          isValid: true,
          reason: 'License expired but within grace period',
          grace_period_days: 7 - daysExpired,
          features_available: this.currentLicense.features,
          restrictions: ['License expired - please renew soon']
        };
      } else {
        // Beyond grace period
        return {
          isValid: false,
          reason: 'License expired beyond grace period',
          features_available: ['basic_pos'], // Only basic functionality
          restrictions: ['Most features disabled due to expired license']
        };
      }
    }

    // Validate hardware fingerprint (anti-piracy)
    if (!await this.validateHardwareBinding()) {
      return {
        isValid: false,
        reason: 'License not valid for this hardware',
        features_available: [],
        restrictions: ['License bound to different hardware']
      };
    }

    // Check transaction limits for Starter tier
    if (this.currentLicense.tier === 'starter') {
      const currentMonthTransactions = await this.getCurrentMonthTransactionCount();
      
      if (currentMonthTransactions >= this.currentLicense.limitations.maxTransactions) {
        return {
          isValid: true,
          reason: 'Transaction limit reached',
          features_available: this.currentLicense.features,
          restrictions: ['Monthly transaction limit reached - upgrade to continue']
        };
      }
    }

    return {
      isValid: true,
      features_available: this.currentLicense.features,
      restrictions: []
    };
  }

  private async validateHardwareBinding(): Promise<boolean> {
    if (!this.fingerprint) return false;
    
    // In a production system, this would validate against a server-side record
    // For now, we'll validate that the stored license was created for this machine
    const storedFingerprint = localStorage.getItem('unipos-fingerprint');
    
    if (!storedFingerprint) {
      // First time, store the fingerprint
      localStorage.setItem('unipos-fingerprint', JSON.stringify(this.fingerprint));
      return true;
    }
    
    try {
      const stored = JSON.parse(storedFingerprint);
      return stored.machineId === this.fingerprint.machineId;
    } catch (error) {
      return false;
    }
  }

  private async getCurrentMonthTransactionCount(): Promise<number> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const transactions = await this.fyo.db.getAllRaw('SalesInvoice', {
        filters: {
          date: ['>=', startOfMonth]
        }
      });
      
      return transactions.length;
    } catch (error) {
      console.error('Error counting transactions:', error);
      return 0;
    }
  }

  async activateLicense(licenseKey: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate license key format
      if (!this.isValidLicenseKeyFormat(licenseKey)) {
        return { success: false, message: 'Invalid license key format' };
      }

      // In production, this would validate against a license server
      const licenseInfo = await this.validateLicenseWithServer(licenseKey);
      
      if (!licenseInfo) {
        return { success: false, message: 'License key not found or invalid' };
      }

      // Store encrypted license
      const encryptedLicense = crypto.AES.encrypt(JSON.stringify(licenseInfo), this.ENCRYPTION_KEY).toString();
      localStorage.setItem('unipos-license', encryptedLicense);
      
      this.currentLicense = licenseInfo;
      
      console.log(`License activated: ${licenseInfo.tier} tier`);
      return { success: true, message: `${licenseInfo.tier} license activated successfully` };
    } catch (error) {
      console.error('Error activating license:', error);
      return { success: false, message: 'Failed to activate license' };
    }
  }

  private isValidLicenseKeyFormat(key: string): boolean {
    // UniPOS license key format: UNIPOS-XXXX-XXXX-XXXX-XXXX
    const pattern = /^UNIPOS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(key);
  }

  private async validateLicenseWithServer(licenseKey: string): Promise<LicenseInfo | null> {
    // In production, this would make an API call to the license server
    // For demo purposes, we'll simulate license validation
    
    const tier = this.getLicenseTierFromKey(licenseKey);
    if (!tier) return null;

    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 1 year from activation

    return this.createLicenseInfo(tier, expirationDate);
  }

  private getLicenseTierFromKey(licenseKey: string): LicenseTier | null {
    // Extract tier from license key (simplified logic)
    if (licenseKey.includes('START')) return 'starter';
    if (licenseKey.includes('PROF')) return 'professional';
    if (licenseKey.includes('ENT')) return 'enterprise';
    
    // Default to starter for demo
    return 'starter';
  }

  private createLicenseInfo(tier: LicenseTier, expirationDate: Date): LicenseInfo {
    const licenseConfigs = {
      starter: {
        features: [
          'basic_pos',
          'inventory_management',
          'basic_reporting',
          'single_location',
          'email_support',
          'standard_receipt_templates'
        ],
        limitations: {
          maxLocations: 1,
          maxTransactions: 1000,
          hasAI: false,
          hasAPI: false,
          hasCustomBranding: false,
          supportLevel: 'email' as const
        },
        paymentInfo: {
          monthlyPrice: 29,
          transactionFee: 0.029,
          currency: 'USD'
        }
      },
      professional: {
        features: [
          'advanced_pos',
          'inventory_management',
          'advanced_reporting',
          'multi_location',
          'ai_features',
          'api_access',
          'priority_support',
          'staff_management',
          'custom_receipt_templates',
          'loyalty_programs',
          'discount_management'
        ],
        limitations: {
          maxLocations: Infinity,
          maxTransactions: Infinity,
          hasAI: true,
          hasAPI: true,
          hasCustomBranding: false,
          supportLevel: 'phone' as const
        },
        paymentInfo: {
          monthlyPrice: 79,
          transactionFee: 0.026,
          currency: 'USD'
        }
      },
      enterprise: {
        features: [
          'enterprise_pos',
          'advanced_inventory',
          'business_intelligence',
          'unlimited_locations',
          'full_ai_suite',
          'custom_integrations',
          'dedicated_support',
          'white_label',
          'custom_development',
          'advanced_security',
          'audit_trails',
          'custom_workflows'
        ],
        limitations: {
          maxLocations: Infinity,
          maxTransactions: Infinity,
          hasAI: true,
          hasAPI: true,
          hasCustomBranding: true,
          supportLevel: 'dedicated' as const
        },
        paymentInfo: {
          monthlyPrice: 199,
          transactionFee: 0.024,
          currency: 'USD'
        }
      }
    };

    const config = licenseConfigs[tier];
    
    return {
      tier,
      isActive: true,
      expirationDate,
      features: config.features,
      limitations: config.limitations,
      paymentInfo: config.paymentInfo
    };
  }

  isFeatureEnabled(feature: string): boolean {
    if (!this.currentLicense) return false;
    
    return this.currentLicense.features.includes(feature);
  }

  getLicenseInfo(): LicenseInfo | null {
    return this.currentLicense;
  }

  async generateLicenseReport(): Promise<{
    currentTier: LicenseTier;
    daysUntilExpiration: number;
    transactionUsage: {
      current: number;
      limit: number;
      percentage: number;
    };
    featuresEnabled: string[];
    upgradeRecommendations: string[];
  }> {
    if (!this.currentLicense) {
      throw new Error('No active license');
    }

    const now = new Date();
    const daysUntilExpiration = Math.ceil((this.currentLicense.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const currentTransactions = await this.getCurrentMonthTransactionCount();
    const transactionLimit = this.currentLicense.limitations.maxTransactions;
    
    const upgradeRecommendations = this.generateUpgradeRecommendations(currentTransactions, transactionLimit);

    return {
      currentTier: this.currentLicense.tier,
      daysUntilExpiration,
      transactionUsage: {
        current: currentTransactions,
        limit: transactionLimit,
        percentage: transactionLimit === Infinity ? 0 : (currentTransactions / transactionLimit) * 100
      },
      featuresEnabled: this.currentLicense.features,
      upgradeRecommendations
    };
  }

  private generateUpgradeRecommendations(currentTransactions: number, limit: number): string[] {
    const recommendations: string[] = [];
    
    if (this.currentLicense?.tier === 'starter') {
      if (currentTransactions > limit * 0.8) {
        recommendations.push('Consider upgrading to Professional for unlimited transactions');
      }
      
      if (currentTransactions > 500) {
        recommendations.push('Professional tier includes AI-powered inventory forecasting');
        recommendations.push('Get advanced analytics and customer insights with Professional');
      }
    }
    
    if (this.currentLicense?.tier === 'professional') {
      const businessSize = currentTransactions > 5000 ? 'large' : 'medium';
      
      if (businessSize === 'large') {
        recommendations.push('Enterprise tier offers custom branding and dedicated support');
        recommendations.push('Advanced integrations available with Enterprise license');
      }
    }
    
    return recommendations;
  }

  private startPeriodicValidation(): void {
    // Validate license every 24 hours
    this.validationTimer = setInterval(async () => {
      await this.validateCurrentLicense();
    }, 24 * 60 * 60 * 1000);
  }

  async deactivateLicense(): Promise<{ success: boolean; message: string }> {
    try {
      localStorage.removeItem('unipos-license');
      localStorage.removeItem('unipos-fingerprint');
      
      this.currentLicense = this.getTrialLicense();
      
      return { success: true, message: 'License deactivated successfully' };
    } catch (error) {
      console.error('Error deactivating license:', error);
      return { success: false, message: 'Failed to deactivate license' };
    }
  }

  async checkLicenseHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!this.currentLicense) {
      return {
        status: 'critical',
        issues: ['No active license'],
        recommendations: ['Activate a license to continue using UniPOS']
      };
    }

    const validation = await this.validateCurrentLicense();
    const now = new Date();
    const daysUntilExpiration = Math.ceil((this.currentLicense.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Check expiration
    if (daysUntilExpiration <= 0) {
      issues.push('License has expired');
      recommendations.push('Renew your license immediately to restore full functionality');
    } else if (daysUntilExpiration <= 7) {
      issues.push(`License expires in ${daysUntilExpiration} days`);
      recommendations.push('Renew your license soon to avoid service interruption');
    } else if (daysUntilExpiration <= 30) {
      issues.push(`License expires in ${daysUntilExpiration} days`);
      recommendations.push('Consider setting up auto-renewal');
    }

    // Check transaction limits
    if (this.currentLicense.tier === 'starter') {
      const currentTransactions = await this.getCurrentMonthTransactionCount();
      const usage = (currentTransactions / this.currentLicense.limitations.maxTransactions) * 100;
      
      if (usage >= 100) {
        issues.push('Monthly transaction limit exceeded');
        recommendations.push('Upgrade to Professional for unlimited transactions');
      } else if (usage >= 80) {
        issues.push(`${usage.toFixed(1)}% of transaction limit used`);
        recommendations.push('Consider upgrading before hitting the limit');
      }
    }

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical';
    if (issues.some(issue => issue.includes('expired') || issue.includes('exceeded'))) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    } else {
      status = 'healthy';
    }

    return { status, issues, recommendations };
  }

  shutdown(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
    }
  }
}