import { Fyo } from 'fyo';
import { ConfigFile, ConfigKeys } from 'fyo/core/types';
import { DateTime } from 'luxon';
import { SetupWizard } from 'models/baseModels/SetupWizard/SetupWizard';
import { ModelNameEnum } from 'models/types';
import SetupWizardSchema from 'schemas/app/SetupWizard.json';
import { Schema } from 'schemas/types';
import { fyo } from 'src/initFyo';

export function getDatesAndPeriodList(
  period: 'This Year' | 'This Quarter' | 'This Month'
): { periodList: DateTime[]; fromDate: DateTime; toDate: DateTime } {
  const toDate: DateTime = DateTime.now().plus({ days: 1 });
  let fromDate: DateTime;

  if (period === 'This Year') {
    fromDate = toDate.minus({ months: 12 });
  } else if (period === 'This Quarter') {
    fromDate = toDate.minus({ months: 3 });
  } else if (period === 'This Month') {
    fromDate = toDate.minus({ months: 1 });
  } else {
    fromDate = toDate.minus({ days: 1 });
  }

  /**
   * periodList: Monthly decrements before toDate until fromDate
   */
  const periodList: DateTime[] = [toDate];
  while (true) {
    const nextDate = periodList.at(0)!.minus({ months: 1 });
    if (nextDate.toMillis() < fromDate.toMillis()) {
      break;
    }

    periodList.unshift(nextDate);
  }
  periodList.shift();

  return {
    periodList,
    fromDate,
    toDate,
  };
}

export async function getSetupWizardDoc() {
  /**
   * This is used cause when setup wizard is running
   * the database isn't yet initialized.
   */
  return await fyo.doc.getNewDoc(
    'SetupWizard',
    {},
    false,
    SetupWizardSchema as Schema,
    SetupWizard
  );
}

export function updateConfigFiles(fyo: Fyo): ConfigFile {
  const configFiles = fyo.config.get(ConfigKeys.Files, []) as ConfigFile[];

  const companyName = fyo.singles.AccountingSettings!.companyName as string;
  const id = fyo.singles.SystemSettings!.instanceId as string;
  const dbPath = fyo.db.dbPath!;
  const openCount = fyo.singles.Misc!.openCount as number;

  const fileIndex = configFiles.findIndex((f) => f.id === id);
  let newFile = { id, companyName, dbPath, openCount } as ConfigFile;

  if (fileIndex === -1) {
    configFiles.push(newFile);
  } else {
    configFiles[fileIndex].companyName = companyName;
    configFiles[fileIndex].dbPath = dbPath;
    configFiles[fileIndex].openCount = openCount;
    newFile = configFiles[fileIndex];
  }

  fyo.config.set(ConfigKeys.Files, configFiles);
  return newFile;
}

export const docsPathMap: Record<string, string | undefined> = {
  // Analytics
  Dashboard: 'analytics/dashboard',
  Reports: 'analytics/reports',
  GeneralLedger: 'analytics/general-ledger',
  ProfitAndLoss: 'analytics/profit-and-loss',
  BalanceSheet: 'analytics/balance-sheet',
  TrialBalance: 'analytics/trial-balance',

  // Transactions
  [ModelNameEnum.SalesInvoice]: 'transactions/sales-invoices',
  [ModelNameEnum.PurchaseInvoice]: 'transactions/purchase-invoices',
  [ModelNameEnum.Payment]: 'transactions/payments',
  [ModelNameEnum.JournalEntry]: 'transactions/journal-entries',

  // Entries
  Entries: 'entries/entries',
  [ModelNameEnum.Party]: 'entries/party',
  [ModelNameEnum.Item]: 'entries/items',
  [ModelNameEnum.Tax]: 'entries/taxes',

  // Miscellaneous
  Search: 'miscellaneous/search',
  NumberSeries: 'miscellaneous/number-series',
  DataImport: 'miscellaneous/data-import',
  Settings: 'miscellaneous/settings',
  ChartOfAccounts: 'miscellaneous/chart-of-accounts',
};
