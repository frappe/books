import { ConfigKeys } from 'fyo/core/types';
import { getSingleValue } from 'fyo/utils';
import { DateTime } from 'luxon';
import { SetupWizard } from 'models/baseModels/SetupWizard/SetupWizard';
import { ModelNameEnum } from 'models/types';
import SetupWizardSchema from 'schemas/app/SetupWizard.json';
import { Schema } from 'schemas/types';
import { fyo } from 'src/initFyo';

export function getDatesAndPeriodList(
  period: 'This Year' | 'This Quarter' | 'This Month'
): { periodList: DateTime[]; fromDate: DateTime; toDate: DateTime } {
  const toDate: DateTime = DateTime.now();
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

export async function getSetupComplete(): Promise<boolean> {
  return !!(await getSingleValue(
    'setupComplete',
    ModelNameEnum.AccountingSettings,
    fyo
  ));
}

export function incrementOpenCount() {
  let openCount = fyo.config.get(ConfigKeys.OpenCount);
  if (typeof openCount !== 'number') {
    openCount = 1;
  } else {
    openCount += 1;
  }

  fyo.config.set(ConfigKeys.OpenCount, openCount);
}

export async function startTelemetry() {
  fyo.telemetry.interestingDocs = [
    ModelNameEnum.Payment,
    ModelNameEnum.SalesInvoice,
    ModelNameEnum.PurchaseInvoice,
    ModelNameEnum.JournalEntry,
    ModelNameEnum.Party,
    ModelNameEnum.Item,
  ];
  await fyo.telemetry.start();
}
