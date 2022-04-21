import { Fyo } from 'fyo';
import { DateTime } from 'luxon';
import {
  getFiscalYear,
  getPeriodList,
} from 'reports/FinancialStatements/financialStatements';
import { FinancialStatementOptions } from 'reports/types';

class Cashflow {
  fyo: Fyo;
  constructor(fyo: Fyo) {
    this.fyo = fyo;
  }
  async run(options: FinancialStatementOptions) {
    const { fromDate, toDate, periodicity } = options;
    const res = await this.fyo.db.getCashflow(fromDate, toDate);
    const fiscalYear = await getFiscalYear(this.fyo);
    const periodList = getPeriodList(
      fromDate,
      toDate,
      periodicity!,
      fiscalYear
    );

    const data = periodList.map((periodKey) => {
      const monthYear = this.getMonthYear(periodKey, 'MMM yyyy');
      const cashflowForPeriod = res.find((d) => d['month-year'] === monthYear);

      if (cashflowForPeriod) {
        return { ...cashflowForPeriod, periodKey };
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

  getMonthYear(periodKey: string, format: string) {
    return DateTime.fromFormat(periodKey, format).toFormat('MM-yyyy');
  }
}

export default Cashflow;
