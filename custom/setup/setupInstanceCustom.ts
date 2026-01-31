import { Fyo } from 'fyo';
import setupInstance from 'src/setup/setupInstance';
import { SetupWizardOptions } from 'src/setup/types';
import { createDefaultSuperAdmin } from './createDefaultSuperAdmin';

/**
 * Custom setup wrapper that extends the base setupInstance
 * to create a default super admin user
 */
export default async function setupInstanceCustom(
  dbPath: string,
  setupWizardOptions: SetupWizardOptions,
  fyo: Fyo
) {
  // Call the original setup
  await setupInstance(dbPath, setupWizardOptions, fyo);

  // Create default super admin user if no users exist
  await createDefaultSuperAdmin(fyo);
}
