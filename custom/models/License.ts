import { Doc } from 'fyo/model/doc';
import { DateTime } from 'luxon';
import { showToast } from 'src/utils/interactive';

export class License extends Doc {
  license_key?: string;
  status?: string;
  organization?: string;
  last_validation_date?: Date;
  next_validation_due?: Date;
  validation_status?: string;

  async beforeInsert() {
    await super.beforeInsert?.();
    await this.setOrganization();
  }

  async beforeUpdate() {
    await super.beforeUpdate?.();
    await this.setOrganization();
  }

  async beforeSync() {
    await super.beforeSync?.();
    // Auto-validate license key on save
    if (this.license_key) {
      const result = await this.validateWithServer();
      await this.set('status', result.status);
      
      if (result.valid) {
        showToast({
          message: 'License validated successfully',
          type: 'success',
        });
      } else {
        showToast({
          message: result.error || 'License validation failed',
          type: 'error',
        });
      }
    }
  }

  async setOrganization() {
    if (!this.organization) {
      const companyName = await this.fyo.getValue('AccountingSettings', 'companyName');
      this.organization = companyName as string;
    }
  }

  async checkSyncStatus(): Promise<number> {
    if (!this.last_validation_date) {
      return 999; // Never synced
    }

    const lastSync = DateTime.fromJSDate(new Date(this.last_validation_date));
    const now = DateTime.now();
    const daysSinceSync = Math.floor(now.diff(lastSync, 'days').days);
    return daysSinceSync;
  }

  async needsSync(): Promise<boolean> {
    const daysSinceSync = await this.checkSyncStatus();
    return daysSinceSync >= 7;
  }

  async validateWithServer(): Promise<{
    valid: boolean;
    status: string;
    error?: string;
  }> {
    try {
      if (!this.license_key) {
        return {
          valid: false,
          status: 'Invalid',
          error: 'No license key provided',
        };
      }

      if (this.fyo.isElectron) {
        const result = await ipc.validateLicense(this.license_key);
        
        // Update validation dates
        await this.set('last_validation_date', new Date());
        await this.set('validation_status', result.status);
        
        const nextDue = DateTime.now().plus({ days: 7 }).toJSDate();
        await this.set('next_validation_due', nextDue);
        
        await this.sync();
        
        return result;
      }

      return {
        valid: false,
        status: 'Error',
        error: 'Not running in Electron',
      };
    } catch (error) {
      console.error('License validation error:', error);
      return {
        valid: false,
        status: 'Error',
        error: (error as Error).message,
      };
    }
  }
}
