import { assertDoesNotThrow } from 'backend/database/tests/helpers';
import setupInstance from 'src/setup/setupInstance';
import { SetupWizardOptions } from 'src/setup/types';
import test from 'tape';
import { getValueMapFromList } from 'utils';
import {
  getTestDbPath,
  getTestFyo,
  getTestSetupWizardOptions
} from './helpers';

const dbPath = getTestDbPath();
const setupOptions = getTestSetupWizardOptions();
const fyo = getTestFyo();

test('setupInstance', async () => {
  await assertDoesNotThrow(async () => {
    await setupInstance(dbPath, setupOptions, fyo);
  }, 'setup instance failed');
});

test('check setup Singles', async (t) => {
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

    t.equal(
      dbValue as string,
      optionsValue,
      `${field}: (${dbValue}, ${optionsValue})`
    );
  }
});

test('check null singles', async (t) => {
  const nullFields = ['gstin', 'logo', 'phone', 'address'];
  const nullSingles = await fyo.db.getSingleValues(...nullFields);

  t.equal(
    nullSingles.length,
    0,
    `null singles: ${JSON.stringify(nullSingles)}`
  );
});

test.onFinish(async () => {
  await fyo.close();
});
