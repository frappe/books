import { ConfigKeys } from 'fyo/core/types';
import { getSingleValue } from 'fyo/utils';
import { DateTime } from 'luxon';
import { SetupWizard } from 'models/baseModels/SetupWizard/SetupWizard';
import { ModelNameEnum } from 'models/types';
import SetupWizardSchema from 'schemas/app/SetupWizard.json';
import { Schema } from 'schemas/types';
import { fyo } from 'src/initFyo';

export async function getDatesAndPeriodicity(
  period: 'This Year' | 'This Quarter' | 'This Month'
) {
  let fromDate, toDate;
  const periodicity = 'Monthly';
  const accountingSettings = await fyo.doc.getSingle('AccountingSettings');

  if (period === 'This Year') {
    fromDate = accountingSettings.fiscalYearStart;
    toDate = accountingSettings.fiscalYearEnd;
  } else if (period === 'This Quarter') {
    fromDate = DateTime.local().startOf('quarter').toISODate();
    toDate = DateTime.local().endOf('quarter').toISODate();
  } else if (period === 'This Month') {
    fromDate = DateTime.local().startOf('month').toISODate();
    toDate = DateTime.local().endOf('month').toISODate();
  }

  return {
    fromDate,
    toDate,
    periodicity,
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
