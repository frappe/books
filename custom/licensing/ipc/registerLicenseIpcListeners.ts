/**
 * License IPC Handlers
 * Exposes licensing operations to renderer process
 * Follows existing IPC pattern in main/registerIpcMainActionListeners.ts
 */

import { ipcMain } from 'electron';
import { getLicenseManager, getSubscriptionManager } from '../index';
import { LicenseValidationResult } from '../types';
import { Main } from '../../../main';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts any value to a plain JSON-serializable object.
 * Electron IPC uses the structured clone algorithm — class instances, Errors
 * with non-primitive properties, and undefined values cannot be cloned.
 * Running responses through this prevents "An object could not be cloned."
 */
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Extracts a safe string message from any thrown value.
 * Re-throws as a plain Error so Electron IPC can serialize it.
 */
function ipcError(error: unknown): never {
  throw new Error(error instanceof Error ? error.message : String(error));
}

// ─── IPC Action constants ─────────────────────────────────────────────────────

export const LICENSE_IPC_ACTIONS = {
  ACTIVATE_LICENSE: 'activate-license',
  CHECK_LICENSE: 'check-license',
  GET_LICENSE_STATE: 'get-license-state',
  CLEAR_LICENSE: 'clear-license',
  // Subscription actions
  GET_PAYMENT_METHODS: 'get-payment-methods',
  GET_SUBSCRIPTION_AMOUNT: 'get-subscription-amount',
  INITIATE_PAYMENT: 'initiate-payment',
  CHECK_PAYMENT_STATUS: 'check-payment-status',
  COMPLETE_SUBSCRIPTION: 'complete-subscription',
} as const;

// ─── Registration ─────────────────────────────────────────────────────────────

export default function registerLicenseIpcListeners(_main: Main) {
  /**
   * Activate a license key
   */
  ipcMain.handle(
    LICENSE_IPC_ACTIONS.ACTIVATE_LICENSE,
    async (_, licenseKey: string): Promise<LicenseValidationResult> => {
      try {
        const manager = getLicenseManager();
        const result = await manager.activateLicense(licenseKey);
        return toPlain(result);
      } catch (error) {
        console.error('License activation error:', error);
        return toPlain({
          state: 'INVALID' as const,
          isValid: false,
          error: error instanceof Error ? error.message : 'Activation failed',
          lastValidatedAt: new Date(),
          validatedOnline: false,
        });
      }
    }
  );

  /**
   * Check license status (online + offline)
   */
  ipcMain.handle(
    LICENSE_IPC_ACTIONS.CHECK_LICENSE,
    async (): Promise<LicenseValidationResult> => {
      try {
        const manager = getLicenseManager();
        const result = await manager.checkLicense();
        console.log('\n=== IPC CHECK_LICENSE Result ===');
        console.log('licenseeEmail:', result.licenseeEmail);
        console.log('licenseeName:', result.licenseeName);
        console.log('Full result:', JSON.stringify(result, null, 2));
        return toPlain(result);
      } catch (error) {
        console.error('License check error:', error);
        return toPlain({
          state: 'INVALID' as const,
          isValid: false,
          error: error instanceof Error ? error.message : 'Check failed',
          lastValidatedAt: new Date(),
          validatedOnline: false,
        });
      }
    }
  );

  /**
   * Get current license state (from memory, or fresh check if unavailable)
   */
  ipcMain.handle(
    LICENSE_IPC_ACTIONS.GET_LICENSE_STATE,
    async (): Promise<LicenseValidationResult | null> => {
      try {
        const manager = getLicenseManager();
        const currentState = manager.getCurrentState();
        if (!currentState) {
          return toPlain(await manager.checkLicense());
        }
        return toPlain(currentState);
      } catch (error) {
        console.error('Get license state error:', error);
        return null;
      }
    }
  );

  /**
   * Clear/deactivate license
   */
  ipcMain.handle(LICENSE_IPC_ACTIONS.CLEAR_LICENSE, async (): Promise<void> => {
    try {
      const manager = getLicenseManager();
      await manager.clearLicense();
    } catch (error) {
      console.error('Clear license error:', error);
      ipcError(error);
    }
  });

  /**
   * Get available payment methods.
   *
   * Dummy values are used internally — the Preview endpoint only needs a valid
   * phone number format and a non-zero amount to return active channels.
   * No real user data is required or collected at this stage.
   *
   * Renderer call:
   *   await window.ipc.invoke('get-payment-methods')
   */
  ipcMain.handle(LICENSE_IPC_ACTIONS.GET_PAYMENT_METHODS, async () => {
    try {
      const subscriptionManager = getSubscriptionManager();
      // Dummy values — only used to satisfy the API schema so it returns
      // the list of active payment channels. Not tied to any real transaction.
      const DUMMY_PHONE = '255700000000';
      const DUMMY_AMOUNT = Number(process.env.YEARLY_LICENSE_PRICE) || 500000;
      const methods = await subscriptionManager.getPaymentMethods(
        DUMMY_PHONE,
        DUMMY_AMOUNT
      );
      return toPlain(methods);
    } catch (error) {
      console.error('Get payment methods error:', error);
      ipcError(error);
    }
  });

  /**
   * Get subscription amount from environment.
   *
   * Renderer call:
   *   await window.ipc.invoke('get-subscription-amount')
   */
  ipcMain.handle(LICENSE_IPC_ACTIONS.GET_SUBSCRIPTION_AMOUNT, () => {
    return Number(process.env.YEARLY_LICENSE_PRICE) || 0;
  });

  /**
   * Initiate a USSD-PUSH payment.
   *
   * Renderer call:
   *   await window.ipc.invoke('initiate-payment', { phoneNumber, paymentMethod })
   */
  ipcMain.handle(
    LICENSE_IPC_ACTIONS.INITIATE_PAYMENT,
    async (
      _,
      {
        phoneNumber,
        paymentMethod,
        amount,
      }: { phoneNumber: string; paymentMethod: string; amount: number }
    ) => {
      try {
        const subscriptionManager = getSubscriptionManager();
        const result = await subscriptionManager.initiatePayment({
          phoneNumber,
          paymentMethod,
          amount,
        });
        return toPlain(result);
      } catch (error) {
        console.error('Initiate payment error:', error);
        ipcError(error);
      }
    }
  );

  /**
   * Check payment status by orderReference.
   *
   * Renderer call:
   *   await window.ipc.invoke('check-payment-status', orderReference)
   */
  ipcMain.handle(
    LICENSE_IPC_ACTIONS.CHECK_PAYMENT_STATUS,
    async (_, orderReference: string) => {
      try {
        const subscriptionManager = getSubscriptionManager();
        const result = await subscriptionManager.checkPaymentStatus(
          orderReference
        );
        return toPlain(result);
      } catch (error) {
        console.error('Check payment status error:', error);
        ipcError(error);
      }
    }
  );

  /**
   * Complete subscription — creates and auto-activates a new license key.
   *
   * Renderer call:
   *   await window.ipc.invoke('complete-subscription', transactionId)
   */
  ipcMain.handle(
    LICENSE_IPC_ACTIONS.COMPLETE_SUBSCRIPTION,
    async (_, transactionId: string) => {
      try {
        const subscriptionManager = getSubscriptionManager();
        const result = await subscriptionManager.completeSubscription(
          transactionId
        );

        if (result.success && result.newLicenseKey) {
          const licenseManager = getLicenseManager();
          const activationResult = await licenseManager.activateLicense(
            result.newLicenseKey
          );
          return toPlain({ ...result, activationResult });
        }

        return toPlain(result);
      } catch (error) {
        console.error('Complete subscription error:', error);
        ipcError(error);
      }
    }
  );
}
