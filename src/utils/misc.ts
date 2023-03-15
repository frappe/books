import { Fyo } from 'fyo';
import { ConfigFile, ConfigKeys } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { DateTime } from 'luxon';
import { SetupWizard } from 'models/baseModels/SetupWizard/SetupWizard';
import { ModelNameEnum } from 'models/types';
import SetupWizardSchema from 'schemas/app/SetupWizard.json';
import { Schema } from 'schemas/types';
import { fyo } from 'src/initFyo';
import { QueryFilter } from 'utils/db/types';
import { PeriodKey } from './types';

export function getDatesAndPeriodList(period: PeriodKey): {
  periodList: DateTime[];
  fromDate: DateTime;
  toDate: DateTime;
} {
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

export function getSetupWizardDoc() {
  /**
   * This is used cause when setup wizard is running
   * the database isn't yet initialized.
   */
  return fyo.doc.getNewDoc(
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

  // Inventory
  [ModelNameEnum.StockMovement]: 'inventory/stock-movement',
  [ModelNameEnum.Shipment]: 'inventory/shipment',
  [ModelNameEnum.PurchaseReceipt]: 'inventory/purchase-receipt',
  StockLedger: 'inventory/stock-ledger',
  StockBalance: 'inventory/stock-balance',
  [ModelNameEnum.Batch]: 'inventory/batches',

  // Entries
  Entries: 'entries/entries',
  [ModelNameEnum.Party]: 'entries/party',
  [ModelNameEnum.Item]: 'entries/items',
  [ModelNameEnum.Tax]: 'entries/taxes',
  [ModelNameEnum.PrintTemplate]: 'miscellaneous/print-templates',

  // Miscellaneous
  Search: 'miscellaneous/search',
  NumberSeries: 'miscellaneous/number-series',
  ImportWizard: 'miscellaneous/import-wizard',
  Settings: 'miscellaneous/settings',
  ChartOfAccounts: 'miscellaneous/chart-of-accounts',
};

export async function getDataURL(type: string, data: Uint8Array) {
  const blob = new Blob([data], { type });

  return new Promise<string>((resolve) => {
    const fr = new FileReader();
    fr.addEventListener('loadend', () => {
      resolve(fr.result as string);
    });

    fr.readAsDataURL(blob);
  });
}

export async function convertFileToDataURL(file: File, type: string) {
  const buffer = await file.arrayBuffer();
  const array = new Uint8Array(buffer);
  return await getDataURL(type, array);
}

export function getCreateFiltersFromListViewFilters(filters: QueryFilter) {
  const createFilters: Record<string, string | number | boolean | null> = {};

  for (const key in filters) {
    let value: typeof filters[string] | undefined | number = filters[key];

    if (Array.isArray(value) && value[0] === 'in' && Array.isArray(value[1])) {
      value = value[1].filter((v) => v !== 'Both')[0];
    }

    if (value === undefined || Array.isArray(value)) {
      continue;
    }

    createFilters[key] = value;
  }

  return createFilters;
}

export class FocusedDocContextSet {
  set: Doc[];
  constructor() {
    this.set = [];
  }

  add(doc: unknown) {
    if (!(doc instanceof Doc)) {
      return;
    }

    const index = this.findIndex(doc);
    if (index !== -1) {
      this.delete(index);
    }

    return this.set.push(doc);
  }

  delete(index: Doc | number) {
    if (typeof index !== 'number') {
      index = this.findIndex(index);
    }

    if (index === -1) {
      return;
    }

    this.set = this.set.filter((_, i) => i !== index);
  }

  last() {
    return this.set.at(-1);
  }

  findIndex(doc: Doc) {
    return this.set.findIndex(
      (d) => d.name === doc.name && d.schemaName === doc.schemaName
    );
  }
}
