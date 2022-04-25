import * as assert from 'assert';
import { DatabaseManager } from 'backend/database/manager';
import { assertDoesNotThrow } from 'backend/database/tests/helpers';
import { Fyo } from 'fyo';
import { DummyAuthDemux } from 'fyo/tests/helpers';
import 'mocha';
import setupInstance from 'src/setup/setupInstance';
import { SetupWizardOptions } from 'src/setup/types';
import { getValueMapFromList } from 'utils';
import { getTestDbPath, getTestSetupWizardOptions } from './helpers';

describe('setupInstance', function () {
  const dbPath = getTestDbPath();
  const setupOptions = getTestSetupWizardOptions();

  let fyo: Fyo;

  this.beforeAll(function () {
    fyo = new Fyo({
      DatabaseDemux: DatabaseManager,
      AuthDemux: DummyAuthDemux,
      isTest: true,
      isElectron: false,
    });
  });

  this.afterAll(async function () {
    await fyo.close();
  });

  specify('setupInstance', async function () {
    await assertDoesNotThrow(async () => {
      await setupInstance(dbPath, setupOptions, fyo);
    }, 'setup instance failed');
  });

  specify('check setup Singles', async function () {
    const setupFields = [
      'companyName',
      'country',
      'fullname',
      'email',
      'bankName',
      'fiscalYearStart',
      'fiscalYearEnd',
      'currency',
    ];

    const setupSingles = await fyo.db.getSingleValues(...setupFields);
    const singlesMap = getValueMapFromList(setupSingles, 'fieldname', 'value');

    for (const field of setupFields) {
      let dbValue = singlesMap[field];
      const optionsValue = setupOptions[field as keyof SetupWizardOptions];

      if (dbValue instanceof Date) {
        dbValue = dbValue.toISOString().split('T')[0];
      }

      assert.strictEqual(dbValue as string, optionsValue, `${field} mismatch`);
    }
  });

  specify('check null singles', async function () {
    const nullFields = ['gstin', 'logo', 'phone', 'address'];
    const nullSingles = await fyo.db.getSingleValues(...nullFields);

    assert.strictEqual(
      nullSingles.length,
      0,
      `null singles found ${JSON.stringify(nullSingles)}`
    );
  });
});
