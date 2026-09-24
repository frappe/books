import test from 'tape';
import { Fyo } from 'fyo';
import { DatabaseManager } from 'backend/database/manager';
import { DummyAuthDemux } from 'fyo/tests/helpers';
import { SetupWizardOptions } from 'src/setup/types';
import setupInstance from 'src/setup/setupInstance';
import { ModelNameEnum } from 'models/types';

/**
 * Integration test for Slovakia setup.
 *
 * Verifies that selecting "Slovakia" during company setup:
 * 1. Creates the Slovak COA (Účtová osnova) with expected accounts
 * 2. Creates DPH (VAT) tax templates at the correct rates (23/19/5/0)
 * 3. Makes the IČ DPH (Tax ID) field available in AccountingSettings
 */

const fyo = new Fyo({
  DatabaseDemux: DatabaseManager,
  AuthDemux: DummyAuthDemux,
  isTest: true,
  isElectron: false,
});

const slovakSetupOptions: SetupWizardOptions = {
  logo: null,
  companyName: 'Testovacia Spoločnosť',
  country: 'Slovakia',
  fullname: 'Ján Novák',
  email: 'jan@test.sk',
  bankName: 'Testovacia Banka',
  currency: 'EUR',
  fiscalYearStart: '2025-01-01',
  fiscalYearEnd: '2025-12-31',
  chartOfAccounts: 'Slovakia - Účtová osnova',
};

test('setup: testSlovakSetup', async (t) => {
  await setupInstance(':memory:', slovakSetupOptions, fyo);
  t.ok(true, 'Slovak setup instance completed without errors');
});

test('Slovak COA: key accounts exist', async (t) => {
  // Cash account (211 Pokladnica)
  const cashAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Cash' },
  });
  t.ok(cashAccounts.length > 0, 'Cash account exists');

  // Bank account group (221 Bankové účty)
  const bankAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Bank', isGroup: true },
  });
  t.ok(bankAccounts.length > 0, 'Bank account group exists');

  // Trade receivables (311 Odberatelia)
  const receivableAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Receivable' },
  });
  t.ok(receivableAccounts.length > 0, 'Receivable account exists');

  // Trade payables (321 Dodávatelia)
  const payableAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Payable' },
  });
  t.ok(payableAccounts.length > 0, 'Payable account exists');

  // Tax account (DPH under 343 Daň z pridanej hodnoty)
  const taxAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Tax' },
  });
  t.ok(taxAccounts.length > 0, 'Tax (DPH) account exists');
  t.ok(
    taxAccounts.some((a) => String(a.name) === 'DPH'),
    'DPH account found by name'
  );

  // Equity account (411 Základné imanie)
  const equityAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Equity' },
  });
  t.ok(equityAccounts.length > 0, 'Equity account exists');

  // Stock account (112 Materiál na sklade)
  const stockAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Stock' },
  });
  t.ok(stockAccounts.length > 0, 'Stock account exists');
});

test('Slovak COA: root types are correct', async (t) => {
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

test('Slovak DPH tax templates were created', async (t) => {
  const taxes = await fyo.db.getAllRaw('Tax', { fields: ['name'] });
  const taxNames = taxes.map((t) => String(t.name));

  t.ok(taxNames.includes('DPH-23'), 'DPH-23 (23% standard rate) exists');
  t.ok(taxNames.includes('DPH-19'), 'DPH-19 (19% first reduced rate) exists');
  t.ok(taxNames.includes('DPH-5'), 'DPH-5 (5% second reduced rate) exists');
  t.ok(
    taxNames.includes('Oslobodené od DPH'),
    'Oslobodené od DPH (exempt) exists'
  );
});

test('Slovak DPH tax templates have correct rates', async (t) => {
  const expectedRates: Record<string, number> = {
    'DPH-23': 23,
    'DPH-19': 19,
    'DPH-5': 5,
    'Oslobodené od DPH': 0,
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
    t.equal(String(taxDetails[0].account), 'DPH', `${taxName} account is DPH`);
  }
});

test('Slovak AccountingSettings has IČ DPH (taxId) field', async (t) => {
  const schema = fyo.schemaMap['AccountingSettings'];
  t.ok(schema, 'AccountingSettings schema exists');

  const taxIdField = schema?.fields?.find((f) => f.fieldname === 'taxId');
  t.ok(taxIdField, 'taxId field exists in AccountingSettings schema');
  t.equal(taxIdField?.label, 'IČ DPH', 'taxId field label is "IČ DPH"');
  t.equal(
    taxIdField?.placeholder,
    'SK2012345678',
    'taxId placeholder is "SK2012345678"'
  );
});

test('cleanup: testSlovakSetup', async (t) => {
  await fyo.close();
});
