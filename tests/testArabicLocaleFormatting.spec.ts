import test from 'tape';
import { closeTestFyo, getTestFyo } from 'tests/helpers';
import { SetupWizardOptions } from 'src/setup/types';
import { DateTime } from 'luxon';
import setupInstance from 'src/setup/setupInstance';
import { getTestDbPath } from 'tests/helpers';
import { getFiscalYear } from 'utils/misc';
import { format } from 'fyo/utils/format';
import { Field, FieldTypeEnum } from 'schemas/types';

const fyo = getTestFyo();

function getSaudiSetupOptions(): SetupWizardOptions {
  return {
    logo: null,
    companyName: 'Test Saudi Company',
    country: 'Saudi Arabia',
    fullname: 'Test Person',
    email: 'test@test.com',
    bankName: 'Test Bank',
    currency: 'SAR',
    fiscalYearStart: DateTime.fromJSDate(
      getFiscalYear('01-01', true)!
    ).toISODate(),
    fiscalYearEnd: DateTime.fromJSDate(
      getFiscalYear('01-01', false)!
    ).toISODate(),
    chartOfAccounts: 'Saudi Arabia - Chart of Accounts',
  };
}

test('setup: testArabicLocaleFormatting', async () => {
  const options = getSaudiSetupOptions();
  const dbPath = getTestDbPath();
  await setupInstance(dbPath, options, fyo);
});

test('locale is set to ar-SA', async (t) => {
  const locale = fyo.singles.SystemSettings?.locale as string;
  t.equal(locale, 'ar-SA', 'locale should be ar-SA for Saudi Arabia');
});

test('formatted currency uses Latin digits, not Arabic-Indic', async (t) => {
  // Format a known money value using the fyo formatter
  const value = fyo.pesa(1234.56);
  const currencyField: Field = {
    fieldname: 'amount',
    fieldtype: FieldTypeEnum.Currency,
    label: 'Amount',
  };

  const formatted = format(value, currencyField, null, fyo);

  // The formatted string should contain Latin digits (0-9), not
  // Arabic-Indic digits (٠-٩). The bug causes Intl.NumberFormat('ar-SA')
  // to produce Arabic-Indic numerals like "١٬٢٣٤٫٥٦".
  const hasArabicIndicDigits = /[\u0660-\u0669]/.test(formatted);
  t.notOk(
    hasArabicIndicDigits,
    `formatted value should not contain Arabic-Indic digits, got: "${formatted}"`
  );

  const hasLatinDigits = /[0-9]/.test(formatted);
  t.ok(
    hasLatinDigits,
    `formatted value should contain Latin digits, got: "${formatted}"`
  );
});

closeTestFyo(fyo, __filename);
