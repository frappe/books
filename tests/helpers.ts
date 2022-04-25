import { config } from 'dotenv';
import { SetupWizardOptions } from 'src/setup/types';
import { getFiscalYear } from 'utils/misc';

export function getTestSetupWizardOptions(): SetupWizardOptions {
  return {
    logo: null,
    companyName: 'Test Company',
    country: 'India',
    fullname: 'Test Person',
    email: 'test@testmyfantasy.com',
    bankName: 'Test Bank of Scriptia',
    currency: 'INR',
    fiscalYearStart: getFiscalYear('04-01', true),
    fiscalYearEnd: getFiscalYear('04-01', false),
    chartOfAccounts: 'India - Chart of Accounts',
  };
}

export function getTestDbPath() {
  config();
  return process.env.TEST_DB_PATH ?? ':memory:';
}
