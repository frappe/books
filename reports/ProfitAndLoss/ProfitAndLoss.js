const frappe = require('frappejs');
const { getData } = require('../financialStatements');

class ProfitAndLoss {
    async run(params) {
        const filters = {};
        if (params.account) filters.account = params.account;
        if (params.party) filters.party = params.party;
        if (params.referenceType) filters.referenceType = params.referenceType;
        if (params.referenceName) filters.referenceName = params.referenceName;
        if (params.fromDate) filters.date = ['>=', params.fromDate];
        if (params.toDate) filters.date = ['<=', params.toDate];

        let income = await getData({
            rootType: 'Income',
            balanceMustBe: 'Credit'
        });

        let expense = await getData({
            rootType: 'Expense',
            balanceMustBe: 'Credit'
        });

        return data;
    }
}

module.exports = function execute(params) {
    return new ProfitAndLoss().run(params);
}
