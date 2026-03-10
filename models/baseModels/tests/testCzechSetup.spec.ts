import test from 'tape';
import { Fyo } from 'fyo';
import { DatabaseManager } from 'backend/database/manager';
import { DummyAuthDemux } from 'fyo/tests/helpers';
import { SetupWizardOptions } from 'src/setup/types';
import setupInstance from 'src/setup/setupInstance';
import { ModelNameEnum } from 'models/types';

/**
 * Integration test for Czech Republic setup.
 *
 * Verifies that selecting "Czech Republic" during company setup:
 * 1. Creates the Czech COA (Účtová osnova) with expected accounts
 * 2. Creates DPH (VAT) tax templates at the correct rates
 * 3. Makes the DIČ (Tax ID) field available in AccountingSettings
 */

const fyo = new Fyo({
  DatabaseDemux: DatabaseManager,
  AuthDemux: DummyAuthDemux,
  isTest: true,
  isElectron: false,
});

const czechSetupOptions: SetupWizardOptions = {
  logo: null,
  companyName: 'Testovací Společnost',
  country: 'Czech Republic',
  fullname: 'Jan Novák',
  email: 'jan@test.cz',
  bankName: 'Testovací Banka',
  currency: 'CZK',
  fiscalYearStart: '2025-01-01',
  fiscalYearEnd: '2025-12-31',
  chartOfAccounts: 'Czech Republic - Účtová osnova',
};

test('setup: testCzechSetup', async (t) => {
  await setupInstance(':memory:', czechSetupOptions, fyo);
  t.ok(true, 'Czech setup instance completed without errors');
});

test('Czech COA: key accounts exist', async (t) => {
  // Cash account (211 Pokladna)
  const cashAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Cash' },
  });
  t.ok(cashAccounts.length > 0, 'Cash account exists');

  // Bank account group (221 Bankovní účty)
  const bankAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Bank', isGroup: true },
  });
  t.ok(bankAccounts.length > 0, 'Bank account group exists');

  // Trade receivables (311 Pohledávky z obchodních vztahů)
  const receivableAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Receivable' },
  });
  t.ok(receivableAccounts.length > 0, 'Receivable account exists');

  // Trade payables (321 Dluhy z obchodních vztahů)
  const payableAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Payable' },
  });
  t.ok(payableAccounts.length > 0, 'Payable account exists');

  // Tax account (DPH under 343 Daň z přidané hodnoty)
  const taxAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Tax' },
  });
  t.ok(taxAccounts.length > 0, 'Tax (DPH) account exists');
  t.ok(
    taxAccounts.some((a) => String(a.name) === 'DPH'),
    'DPH account found by name'
  );

  // Equity account (411 Základní kapitál)
  const equityAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Equity' },
  });
  t.ok(equityAccounts.length > 0, 'Equity account exists');

  // Stock account (112 Materiál na skladě)
  const stockAccounts = await fyo.db.getAllRaw(ModelNameEnum.Account, {
    filters: { accountType: 'Stock' },
  });
  t.ok(stockAccounts.length > 0, 'Stock account exists');
});

test('Czech COA: root types are correct', async (t) => {
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

test('Czech DPH tax templates were created', async (t) => {
  const taxes = await fyo.db.getAllRaw('Tax', { fields: ['name'] });
  const taxNames = taxes.map((t) => String(t.name));

  t.ok(taxNames.includes('DPH-21'), 'DPH-21 (21% standard rate) exists');
  t.ok(taxNames.includes('DPH-12'), 'DPH-12 (12% reduced rate) exists');
  t.ok(taxNames.includes('DPH-0'), 'DPH-0 (0% zero rate) exists');
  t.ok(
    taxNames.includes('Osvobozeno od DPH'),
    'Osvobozeno od DPH (exempt) exists'
  );
});

test('Czech DPH tax templates have correct rates', async (t) => {
  const expectedRates: Record<string, number> = {
    'DPH-21': 21,
    'DPH-12': 12,
    'DPH-0': 0,
    'Osvobozeno od DPH': 0,
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

test('Czech AccountingSettings has DIČ (taxId) field', async (t) => {
  const schema = fyo.schemaMap['AccountingSettings'];
  t.ok(schema, 'AccountingSettings schema exists');

  const taxIdField = schema?.fields?.find((f) => f.fieldname === 'taxId');
  t.ok(taxIdField, 'taxId field exists in AccountingSettings schema');
  t.equal(taxIdField?.label, 'DIČ', 'taxId field label is "DIČ"');
  t.equal(
    taxIdField?.placeholder,
    'CZ12345678',
    'taxId placeholder is "CZ12345678"'
  );
});

test('cleanup: testCzechSetup', async (t) => {
  await fyo.close();
});
