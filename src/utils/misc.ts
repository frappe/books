import { DateTime } from 'luxon';
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
