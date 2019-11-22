const { getData } = require('../FinancialStatements/FinancialStatements');
const ProfitAndLoss = require('../ProfitAndLoss/ProfitAndLoss');
const { DateTime } = require('luxon');

class Cashflow {
  async run({ fromDate, toDate, periodicity }) {
    let income = await getData({
      rootType: 'Income',
      balanceMustBe: 'Credit',
      fromDate,
      toDate,
      periodicity
    });

    let expense = await getData({
      rootType: 'Expense',
      balanceMustBe: 'Debit',
      fromDate,
      toDate,
      periodicity
    });

    let cashflow = await frappe.db.sql(
      `
      select sum(credit) as inflow, sum(debit) as outflow, strftime("%m-%Y", date) as "month-year"
      from AccountingLedgerEntry
      where account in (
        select name from Account where accountType in ('Receivable', 'Payable', 'Stock', 'Fixed Asset', 'Equity')
      )
      and date >= $fromDate and date <= $toDate
      group by strftime("%m-%Y", date)
    `,
      { $fromDate: fromDate, $toDate: toDate }
    );

    let depreciation = await frappe.db.sql(
      `
      select sum(credit) as credit, sum(debit) as debit, strftime("%m-%Y", date) as "month-year"
      from AccountingLedgerEntry
      where account in (
        select name from Account where accountType = "Depreciation"
      )
      and date >= $fromDate and date <= $toDate
      group by strftime("%m-%Y", date)
    `,
      { $fromDate: fromDate, $toDate: toDate }
    );

    let periodList = income.periodList;

    let data = periodList.map(periodKey => {
      let monthYear = this.getMonthYear(periodKey, 'MMM yyyy');
      let cashflowForPeriod = cashflow.find(d => d['month-year'] === monthYear);
      if (cashflowForPeriod) {
        cashflowForPeriod.periodKey = periodKey;
        return cashflowForPeriod;
      }
      return {
        inflow: 0,
        outflow: 0,
        periodKey,
        'month-year': monthYear
      };
    });

    let depreciationPeriodList = periodList.map(periodKey => {
      let monthYear = this.getMonthYear(periodKey, 'MMM yyyy');
      let depreciationForPeriod = depreciation.find(
        d => d['month-year'] === monthYear
      );
      if (depreciationForPeriod) {
        depreciationForPeriod.periodKey = periodKey;
        return depreciationForPeriod;
      }
      return {
        debit: 0,
        credit: 0,
        periodKey,
        'month-year': monthYear
      };
    });

    data = data.map((d, i) => {
      d.inflow += income.totalRow[d.periodKey];
      d.outflow -= expense.totalRow[d.periodKey];

      let depreciation = depreciationPeriodList[i];
      d.inflow -= depreciation.credit;
      d.outflow += depreciation.debit;
      return d;
    });

    return {
      data,
      periodList
    };
  }

  getMonthYear(periodKey, format) {
    return DateTime.fromFormat(periodKey, format).toFormat('MM-yyyy');
  }

  getPeriodKey(dateStr, format, periodicity) {
    if (periodicity === 'Monthly') {
      return DateTime.fromFormat(dateStr, format).toFormat('MMM yyyy');
    }
  }
}

module.exports = Cashflow;
