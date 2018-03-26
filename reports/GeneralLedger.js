const frappe = require('frappejs');

module.exports = class GeneralLedger {
    async run(params) {
        const filters = {};
        if (params.account) filters.account = params.account;
        if (params.party) filters.party = params.party;
        if (params.from_date) filters.date = ('>=', params.from_date);
        if (params.to_date) filters.date = ('<=', params.to_date);

        let data = await frappe.db.getAll({
            doctype: 'AccountingLedgerEntry',
            fields: ['date', 'account', 'party', 'referenceType', 'referenceName', 'debit', 'credit'],
            filters: filters
        });

        return data;
    }
}