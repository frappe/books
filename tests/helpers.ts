import { DatabaseManager } from 'backend/database/manager';
import { config } from 'dotenv';
import { Fyo } from 'fyo';
import { DummyAuthDemux } from 'fyo/tests/helpers';
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

export function getTestDbPath(dbPath?: string) {
  config();
  return dbPath ?? process.env.TEST_DB_PATH ?? ':memory:';
}

export function getTestFyo(): Fyo {
  return new Fyo({
    DatabaseDemux: DatabaseManager,
    AuthDemux: DummyAuthDemux,
    isTest: true,
    isElectron: false,
  });
}
