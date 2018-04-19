const frappe = require('frappejs');
const { getData } = require('../financialStatements');

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

        return { income, expense };
    }
}

module.exports = function execute(params) {
    return new ProfitAndLoss().run(params);
}
