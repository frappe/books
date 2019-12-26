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
      fields: [
        'date',
        'account',
        'party',
        'referenceType',
        'referenceName',
        'debit',
        'credit'
      ],
      filters: filters
    });

    return this.appendOpeningEntry(data);
  }
  appendOpeningEntry(data) {
    let glEntries = [];
    let balance = 0,
      debitTotal = 0,
      creditTotal = 0;

    glEntries.push({
      date: '',
      account: { template: '<b>Opening</b>' },
      party: '',
      debit: 0,
      credit: 0,
      balance: 0,
      referenceType: '',
      referenceName: ''
    });
    for (let entry of data) {
      balance += entry.debit > 0 ? entry.debit : -entry.credit;
      debitTotal += entry.debit;
      creditTotal += entry.credit;
      entry.balance = balance;
      if (entry.debit === 0) {
        entry.debit = '';
      }
      if (entry.credit === 0) {
        entry.credit = '';
      }
      glEntries.push(entry);
    }
    glEntries.push({
      date: '',
      account: { template: '<b>Total</b>' },
      party: '',
      debit: debitTotal,
      credit: creditTotal,
      balance: balance,
      referenceType: '',
      referenceName: ''
    });
    glEntries.push({
      date: '',
      account: { template: '<b>Closing</b>' },
      party: '',
      debit: debitTotal,
      credit: creditTotal,
      balance: balance,
      referenceType: '',
      referenceName: ''
    });
    return glEntries;
  }
}

module.exports = GeneralLedger;
