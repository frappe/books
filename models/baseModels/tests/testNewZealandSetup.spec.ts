import test from 'tape';
import { Fyo } from 'fyo';
import { DatabaseManager } from 'backend/database/manager';
import { DummyAuthDemux } from 'fyo/tests/helpers';
import { SetupWizardOptions } from 'src/setup/types';
import setupInstance from 'src/setup/setupInstance';
import { ModelNameEnum } from 'models/types';

/**
 * Integration test for New Zealand setup.
 *
 * Verifies that selecting "New Zealand" during company setup:
 * 1. Creates the NZ COA with expected accounts (including GST)
 * 2. Creates GST tax templates at the correct rates
 * 3. Makes the IRD Number (taxId) field available in AccountingSettings
 */

const fyo = new Fyo({
  DatabaseDemux: DatabaseManager,
  AuthDemux: DummyAuthDemux,
  isTest: true,
  isElectron: false,
});

const nzSetupOptions: SetupWizardOptions = {
  logo: null,
  companyName: 'Test Company NZ',
  country: 'New Zealand',
  fullname: 'Jane Smith',
  email: 'jane@test.nz',
  bankName: 'Test Bank',
  currency: 'NZD',
  fiscalYearStart: '2025-04-01',
  fiscalYearEnd: '2026-03-31',
  chartOfAccounts: 'New Zealand - Chart of Accounts',
};

test('setup: testNewZealandSetup', async (t) => {
  await setupInstance(':memory:', nzSetupOptions, fyo);
  t.ok(true, 'New Zealand setup instance completed without errors');
});

test('NZ COA: key accounts exist', async (t) => {
  // Cash account
  const cashAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Cash' },
  });
  t.ok(cashAccounts.length > 0, 'Cash account exists');

  // Bank account group
  const bankAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Bank', isGroup: true },
  });
  t.ok(bankAccounts.length > 0, 'Bank account group exists');

  // Trade receivables
  const receivableAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Receivable' },
  });
  t.ok(receivableAccounts.length > 0, 'Receivable account exists');

  // Trade payables
  const payableAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Payable' },
  });
  t.ok(payableAccounts.length > 0, 'Payable account exists');

  // Tax account (GST)
  const taxAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Tax' },
  });
  t.ok(taxAccounts.length > 0, 'Tax (GST) account exists');
  t.ok(
    taxAccounts.some((a) => String(a.name) === 'GST'),
    'GST account found by name'
  );

  // Equity account
  const equityAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Equity' },
  });
  t.ok(equityAccounts.length > 0, 'Equity account exists');

  // Stock account
  const stockAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Stock' },
  });
  t.ok(stockAccounts.length > 0, 'Stock account exists');
});

test('NZ COA: root types are correct', async (t) => {
  const rootTypes = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];
  for (const rootType of rootTypes) {
    const accounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
      filters: { rootType },
    });
    t.ok(
      accounts.length > 0,
      `Accounts with rootType "${rootType}" exist (found ${accounts.length})`
    );
  }
});

test('NZ GST tax templates were created', async (t) => {
  const taxes = await fyo.db.getAllRaw('Tax', { fields: ['name'] });
  const taxNames = taxes.map((t) => String(t.name));

  t.ok(taxNames.includes('GST-15'), 'GST-15 (15% standard rate) exists');
  t.ok(taxNames.includes('GST-9'), 'GST-9 (9% reduced rate) exists');
  t.ok(taxNames.includes('GST-0'), 'GST-0 (0% zero-rated) exists');
  t.ok(taxNames.includes('GST-Exempt'), 'GST-Exempt (exempt) exists');
});

test('NZ GST tax templates have correct rates', async (t) => {
  const expectedRates: Record<string, number> = {
    'GST-15': 15,
    'GST-9': 9,
    'GST-0': 0,
    'GST-Exempt': 0,
  };

  for (const [taxName, expectedRate] of Object.entries(expectedRates)) {
    const taxDetails = await fyo.db.getAllRaw('TaxDetail', {
      fields: ['rate', 'account'],
      filters: { parent: taxName },
    });

    t.ok(taxDetails.length > 0, `${taxName} has tax details`);
    t.equal(
      Number(taxDetails[0].rate),
      expectedRate,
      `${taxName} rate is ${expectedRate}%`
    );
    t.equal(String(taxDetails[0].account), 'GST', `${taxName} account is GST`);
  }
});

test('NZ AccountingSettings has IRD Number (taxId) field', async (t) => {
  const schema = fyo.schemaMap['AccountingSettings'];
  t.ok(schema, 'AccountingSettings schema exists');

  const taxIdField = schema?.fields?.find((f) => f.fieldname === 'taxId');
  t.ok(taxIdField, 'taxId field exists in AccountingSettings schema');
  t.equal(taxIdField?.label, 'IRD Number', 'taxId field label is "IRD Number"');
  t.equal(
    taxIdField?.placeholder,
    '12-345-678',
    'taxId placeholder is "12-345-678"'
  );
});

test('cleanup: testNewZealandSetup', async (t) => {
  await fyo.close();
});
