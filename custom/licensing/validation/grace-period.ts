/**
 * Grace Period Management
 * Calculates offline grace period status and expiration
 */

import { LicenseState } from '../types';

const GRACE_WARNING_DAYS = 2; // Warn when < 2 days remaining

/**
 * Calculate grace period end date
 */
export function calculateGracePeriodEnd(
  lastValidatedAt: Date,
  gracePeriodDays: number
): Date {
  const endDate = new Date(lastValidatedAt);
  endDate.setDate(endDate.getDate() + gracePeriodDays);
  return endDate;
}

/**
 * Get remaining days in grace period
 */
export function getRemainingDays(gracePeriodEndsAt: Date): number {
  const now = new Date();
  const diffMs = gracePeriodEndsAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Check if grace period has expired
 */
export function isGracePeriodExpired(gracePeriodEndsAt: Date): boolean {
  return new Date() > gracePeriodEndsAt;
}

/**
 * Check if grace period is expiring soon (< 2 days)
 */
export function isGracePeriodExpiring(gracePeriodEndsAt: Date): boolean {
  const remaining = getRemainingDays(gracePeriodEndsAt);
  return remaining > 0 && remaining <= GRACE_WARNING_DAYS;
}

/**
 * Determine license state based on grace period
 */
export function determineGracePeriodState(
  gracePeriodEndsAt: Date,
  isOnlineValidation: boolean
): LicenseState {
  if (isOnlineValidation) {
    return LicenseState.ACTIVE_ONLINE;
  }

  if (isGracePeriodExpired(gracePeriodEndsAt)) {
    return LicenseState.GRACE_EXPIRED;
  }

  if (isGracePeriodExpiring(gracePeriodEndsAt)) {
    return LicenseState.GRACE_EXPIRING;
  }

  return LicenseState.ACTIVE_OFFLINE;
}
