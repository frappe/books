const frappe = require('frappejs');
const { getTrialBalance } = require('../FinancialStatements/FinancialStatements');

module.exports = class TrialBalance {
    async run({ fromDate, toDate }) {
        const promises = ['Asset', 'Expense', 'Income', 'Liability', 'Equity'].map(rootType => {
            return getTrialBalance({ rootType, fromDate, toDate });
        });

        const values = await Promise.all(promises);

        let rows = values.reduce((acc, curr) => {
            return [...acc, ...curr];
        }, []);

        return { rows };
    }
}
