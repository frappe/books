/**
 * Custom Licensing Module - Type Definitions
 * Fork-safe: All code in custom/ directory
 */

export enum LicenseState {
  /** Valid license, verified online */
  ACTIVE_ONLINE = 'ACTIVE_ONLINE',
  /** Valid cached license within grace period */
  ACTIVE_OFFLINE = 'ACTIVE_OFFLINE',
  /** Offline grace period ending soon (< 2 days) */
  GRACE_EXPIRING = 'GRACE_EXPIRING',
  /** Grace period expired, must reconnect */
  GRACE_EXPIRED = 'GRACE_EXPIRED',
  /** License validation failed */
  INVALID = 'INVALID',
  /** Subscription expired */
  EXPIRED = 'EXPIRED',
  /** No license found */
  UNLICENSED = 'UNLICENSED',
}

export interface LicenseConfig {
  apiUrl: string;
  accessToken: string;
  productId: string;
  gracePeriodDays: number;
  validationTimeout: number;
  backgroundCheckInterval: number;
}

export interface LicenseValidationResult {
  state: LicenseState;
  isValid: boolean;
  licenseKey?: string;
  licenseeEmail?: string;
  licenseeName?: string;
  expiresAt?: Date;
  gracePeriodEndsAt?: Date;
  daysRemaining?: number;
  error?: string;
  lastValidatedAt: Date;
  validatedOnline: boolean;
}

export interface LicenseCacheData {
  licenseKey: string;
  productId: string;
  hostId: string;
  licenseeEmail?: string;
  licenseeName?: string;
  expiresAt?: string;
  activatedAt: string;
  lastValidatedAt: string;
  gracePeriodEndsAt: string;
  apiResponseHash: string;
}

export interface ActivationRequest {
  productId: string;
  licenseKey: string;
  hostId: string;
}

export interface ValidationRequest {
  productId: string;
  licenseKey: string;
  hostId: string;
}

export interface KeymintApiResponse {
  code: number;
  message: string;
  licensee_name?: string;
  licensee_email?: string;
  expires_at?: string;
  [key: string]: unknown;
}

export interface KeymintErrorResponse {
  code: number;
  message: string;
  error?: string;
}
