/**
 * License IPC Handlers
 * Exposes licensing operations to renderer process
 * Follows existing IPC pattern in main/registerIpcMainActionListeners.ts
 */

import { ipcMain } from 'electron';
import { getLicenseManager } from '../index';
import { LicenseValidationResult } from '../types';
import { Main } from '../../../main';

// IPC Action constants for licensing
export const LICENSE_IPC_ACTIONS = {
  ACTIVATE_LICENSE: 'activate-license',
  CHECK_LICENSE: 'check-license',
  GET_LICENSE_STATE: 'get-license-state',
  CLEAR_LICENSE: 'clear-license',
} as const;

export default function registerLicenseIpcListeners(_main: Main) {
  /**
   * Activate a license key
   */
  ipcMain.handle(
    LICENSE_IPC_ACTIONS.ACTIVATE_LICENSE,
    async (_, licenseKey: string): Promise<LicenseValidationResult> => {
      try {
        const manager = getLicenseManager();
        return await manager.activateLicense(licenseKey);
      } catch (error) {
        console.error('License activation error:', error);
        return {
          state: 'INVALID' as const,
          isValid: false,
          error: error instanceof Error ? error.message : 'Activation failed',
          lastValidatedAt: new Date(),
          validatedOnline: false,
        };
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
        return await manager.checkLicense();
      } catch (error) {
        console.error('License check error:', error);
        return {
          state: 'INVALID' as const,
          isValid: false,
          error: error instanceof Error ? error.message : 'Check failed',
          lastValidatedAt: new Date(),
          validatedOnline: false,
        };
      }
    }
  );

  /**
   * Get current license state (from memory, no API call)
   */
  ipcMain.handle(
    LICENSE_IPC_ACTIONS.GET_LICENSE_STATE,
    (): LicenseValidationResult | null => {
      try {
        const manager = getLicenseManager();
        return manager.getCurrentState();
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
      throw error;
    }
  });
}
