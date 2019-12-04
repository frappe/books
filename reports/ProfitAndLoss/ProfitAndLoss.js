const frappe = require('frappejs');
const { unique } = require('frappejs/utils');
const { getData } = require('../FinancialStatements/FinancialStatements');

class ProfitAndLoss {
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

    let incomeTotalRow = income.totalRow;
    incomeTotalRow.account = {
      template: `<span class="font-semibold">${income.totalRow.account}</span>`
    };

    let expenseTotalRow = expense.totalRow;
    expenseTotalRow.account = {
      template: `<span class="font-semibold">${expense.totalRow.account}</span>`
    };

    let rows = [
      ...income.accounts,
      incomeTotalRow,
      {
        account: {
          template: '<span>&nbsp;</span>'
        },
        isGroup: 1
      },
      ...expense.accounts,
      expenseTotalRow,
      {
        account: {
          template: '<span>&nbsp;</span>'
        },
        isGroup: 1
      }
    ];

    rows = rows.map(row => {
      if (row.indent === 0) {
        row.account = {
          template: `<span class="font-semibold">${row.account}</span>`
        };
      }
      return row;
    });

    const columns = unique([...income.periodList, ...expense.periodList]);

    let profitRow = {
      account: 'Total Profit'
    };

    for (let column of columns) {
      profitRow[column] =
        (income.totalRow[column] || 0.0) - (expense.totalRow[column] || 0.0);

      rows.forEach(row => {
        if (!row.isGroup) {
          row[column] = row[column] || 0.0;
        }
      });
    }

    rows.push(profitRow);

    return { rows, columns };
  }
}

module.exports = ProfitAndLoss;
