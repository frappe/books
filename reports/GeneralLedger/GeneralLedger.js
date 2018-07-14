const frappe = require('frappejs');

class GeneralLedger {
  async run(params) {
    const filters = {};
    if (params.account) filters.account = params.account;
    if (params.party) filters.party = params.party;
    if (params.referenceType) filters.referenceType = params.referenceType;
    if (params.referenceName) filters.referenceName = params.referenceName;
    if (params.toDate || params.fromDate) {
      filters.date = [];
      if (params.toDate) filters.date.push('<=', params.toDate);
      if (params.fromDate) filters.date.push('>=', params.fromDate);
    }

    let data = await frappe.db.getAll({
      doctype: 'AccountingLedgerEntry',
      fields: ['date', 'account', 'party', 'referenceType', 'referenceName', 'debit', 'credit'],
      filters: filters
    });

    return data;
  }
}

module.exports = GeneralLedger;
