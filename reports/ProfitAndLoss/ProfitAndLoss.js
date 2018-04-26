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

        const rows = [
            ...income.accounts, income.totalRow, [],
            ...expense.accounts, expense.totalRow, []
        ];

        const columns = unique([...income.periodList, ...expense.periodList])

        let profitRow = {
            account: 'Total Profit'
        }

        for (let column of columns) {
            profitRow[column] = (income.totalRow[column] || 0.0) - (expense.totalRow[column] || 0.0);
        }

        rows.push(profitRow);

        return { rows, columns };
    }
}

module.exports = ProfitAndLoss;
