import { DatabaseManager } from 'backend/database/manager';
import { assertDoesNotThrow } from 'backend/database/tests/helpers';
import { Fyo } from 'fyo';
import { DummyAuthDemux } from 'fyo/tests/helpers';
import 'mocha';
import setupInstance from 'src/setup/setupInstance';
import { getTestSetupWizardOptions } from './helpers';

const DB_PATH = '/Users/alan/Desktop/test.db';
describe('setupInstance', function () {
  const fyo = new Fyo({
    DatabaseDemux: DatabaseManager,
    AuthDemux: DummyAuthDemux,
    isTest: true,
    isElectron: false,
  });

  const setupOptions = getTestSetupWizardOptions();
  specify('setupInstance', async function () {
    await setupInstance(DB_PATH, setupOptions, fyo);
    await assertDoesNotThrow(async () => {
      // await setupInstance(':memory:', setupOptions, fyo);
    }, 'setup instance failed');
  });
});
