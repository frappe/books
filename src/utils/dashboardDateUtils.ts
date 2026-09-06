import { DateTime } from 'luxon';
import { getDatesAndPeriodList } from './misc';
import { PeriodKey } from './types';

export interface DashboardDateResult {
  fromDate: DateTime;
  toDate: DateTime;
  periodList: DateTime[];
}

export function getDashboardDates(
  period: string,
  fromDate: string | Date,
  toDate: string | Date
): DashboardDateResult {
  let fromDateResult: DateTime;
  let toDateResult: DateTime;
  let periodList: DateTime[] = [];

  if (period === 'Custom') {
    const parseDate = (date: string | Date) =>
      DateTime.fromISO(typeof date === 'string' ? date : date.toISOString());

    fromDateResult = parseDate(fromDate);
    toDateResult = parseDate(toDate);

    let current = fromDateResult.startOf('month');
    const toMonthStart = toDateResult.startOf('month');

    while (current <= toMonthStart) {
      periodList.push(current);
      current = current.plus({ months: 1 });
    }
  } else {
    const dateRange = getDatesAndPeriodList(period as PeriodKey);
    fromDateResult = dateRange.fromDate;
    toDateResult = dateRange.toDate;
    periodList = dateRange.periodList;
  }

  return {
    fromDate: fromDateResult,
    toDate: toDateResult,
    periodList,
  };
}
