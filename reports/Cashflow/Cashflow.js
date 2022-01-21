import frappe from 'frappe';
import { DateTime } from 'luxon';
import { getPeriodList } from '../FinancialStatements/FinancialStatements';

class Cashflow {
  async run({ fromDate, toDate, periodicity }) {
    let cashAndBankAccounts = frappe.db
      .knex('Account')
      .select('name')
      .where('accountType', 'in', ['Cash', 'Bank'])
      .andWhere('isGroup', 0);
    let dateAsMonthYear = frappe.db.knex.raw('strftime("%m-%Y", ??)', 'date');
    let res = await frappe.db
      .knex('AccountingLedgerEntry')
      .where('reverted', 0)
      .sum({
        inflow: 'debit',
        outflow: 'credit',
      })
      .select({
        'month-year': dateAsMonthYear,
      })
      .where('account', 'in', cashAndBankAccounts)
      .whereBetween('date', [fromDate, toDate])
      .groupBy(dateAsMonthYear);

    let periodList = getPeriodList(fromDate, toDate, periodicity);

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
