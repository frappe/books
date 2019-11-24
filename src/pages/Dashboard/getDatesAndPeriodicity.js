import frappe from 'frappejs';
import { DateTime } from 'luxon';

export async function getDatesAndPeriodicity(period) {
  let fromDate, toDate;
  let periodicity = 'Monthly';
  let accountingSettings = await frappe.getSingle('AccountingSettings');

  if (period === 'This Year') {
    fromDate = accountingSettings.fiscalYearStart;
    toDate = accountingSettings.fiscalYearEnd;
  } else if (period === 'This Quarter') {
    fromDate = DateTime.local()
      .startOf('quarter')
      .toISODate();
    toDate = DateTime.local()
      .endOf('quarter')
      .toISODate();
  } else if (period === 'This Month') {
    fromDate = DateTime.local()
      .startOf('month')
      .toISODate();
    toDate = DateTime.local()
      .endOf('month')
      .toISODate();
  }

  return {
    fromDate,
    toDate,
    periodicity
  };
}
