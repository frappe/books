import frappe from 'fyo';
import { DateTime } from 'luxon';
import {
  getFiscalYear,
  getPeriodList,
} from '../FinancialStatements/FinancialStatements';

class Cashflow {
  async run({ fromDate, toDate, periodicity }) {
    const res = await frappe.db.getCashflow(fromDate, toDate);
    let fiscalYear = await getFiscalYear();
    let periodList = getPeriodList(fromDate, toDate, periodicity, fiscalYear);

    let data = periodList.map((periodKey) => {
      let monthYear = this.getMonthYear(periodKey, 'MMM yyyy');
      let cashflowForPeriod = res.find((d) => d['month-year'] === monthYear);
      if (cashflowForPeriod) {
        cashflowForPeriod.periodKey = periodKey;
        return cashflowForPeriod;
      }
      return {
        inflow: 0,
        outflow: 0,
        periodKey,
        'month-year': monthYear,
      };
    });

    return {
      data,
      periodList,
    };
  }

  getMonthYear(periodKey, format) {
    return DateTime.fromFormat(periodKey, format).toFormat('MM-yyyy');
  }
}

export default Cashflow;
