import { assertDoesNotThrow } from 'backend/database/tests/helpers';
import { Fyo } from 'fyo';
import { DummyAuthDemux } from 'fyo/tests/helpers';
import { DatabaseManager } from 'backend/database/manager';
import { DateTime } from 'luxon';
import setupInstance from 'src/setup/setupInstance';
import { SetupWizardOptions } from 'src/setup/types';
import test from 'tape';
import { getFiscalYear } from 'utils/misc';
import { getTestDbPath } from './helpers';

const dbPath = getTestDbPath();

function getJPYSetupOptions(): SetupWizardOptions {
  return {
    logo: null,
    companyName: 'Test JP Company',
    country: 'Japan',
    fullname: 'Test Person',
    email: 'test@testjp.com',
    bankName: 'Test Bank of Japan',
    currency: 'JPY',
    fiscalYearStart: DateTime.fromJSDate(
      getFiscalYear('04-01', true)!
    ).toISODate(),
    fiscalYearEnd: DateTime.fromJSDate(
      getFiscalYear('04-01', false)!
    ).toISODate(),
    chartOfAccounts: 'Standard Chart of Accounts',
  };
}

const fyo = new Fyo({
  DatabaseDemux: DatabaseManager,
  AuthDemux: DummyAuthDemux,
  isTest: true,
  isElectron: false,
});

test('setup JPY instance', async () => {
  const options = getJPYSetupOptions();
  await assertDoesNotThrow(async () => {
    await setupInstance(dbPath, options, fyo);
  }, 'setup JPY instance failed');
});

test('JPY displayPrecision is 0', async (t) => {
  const values = await fyo.db.getSingleValues('displayPrecision');
  const displayPrecision = values.find(
    (v) => v.fieldname === 'displayPrecision'
  );

  t.equals(
    Number(displayPrecision?.value ?? 2),
    0,
    'displayPrecision should be 0 for JPY (zero-decimal currency)'
  );
});

test('re-initialize fyo to pick up displayPrecision', async () => {
  await assertDoesNotThrow(async () => {
    await fyo.initializeAndRegister({}, {}, true);
  }, 're-initialize fyo failed');
});

test('JPY pesa rounds to whole numbers', async (t) => {
  const amount = fyo.pesa(1234.99);
  const rounded = amount.round();

  t.equals(
    rounded,
    '1235',
    'JPY 1234.99 should round to 1235 (0 decimal places)'
  );
});

test('JPY tax calculation produces whole number grand total', async (t) => {
  const baseAmount = fyo.pesa(1127);
  const taxRate = 10;
  const taxAmount = baseAmount.mul(taxRate / 100);
  const grandTotal = baseAmount.add(taxAmount);

  t.equals(
    grandTotal.round(),
    '1240',
    'JPY 1127 + 10% tax = 1239.7 rounds to 1240'
  );
});

test.onFinish(async () => {
  await fyo.close();
});
