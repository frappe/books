import { Fyo } from 'fyo';
import AIService, { AIConfig } from 'src/ai';
import { LicenseManager } from 'src/licensing/LicenseManager';

/**
 * Global fyo: this is meant to be used only by the app. For
 * testing purposes a separate instance of fyo should be initialized.
 */

// Initialize Fyo with enhanced capabilities
const fyoInstance = new Fyo({ isTest: false, isElectron: true });

// Initialize AI services with configuration
const aiConfig: AIConfig = {
  enabled: true,
  modelUpdateInterval: 24 * 60 * 60 * 1000, // 24 hours
  confidenceThreshold: 0.7,
  enableOfflineMode: true
};

// Add AI service to Fyo instance
(fyoInstance as any).ai = new AIService(fyoInstance, aiConfig);

// Add licensing manager to Fyo instance
(fyoInstance as any).license = new LicenseManager(fyoInstance);

export const fyo = fyoInstance;
