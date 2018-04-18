const frappe = require('frappejs');

async function getData(rootType) {
    const accounts = await getAccounts(rootType);
    if (!accounts || accounts.length === 0) return;

    const ledgerEntries = await frappe.db.getAll({
        doctype: 'AccountingLedgerEntry',
        fields: ['account', 'debit', 'credit'],
        filters: {
            account: ['in', accounts]
        }
    });

    let data = {};

    for (let entry of ledgerEntries) {
        if (!data[entry.account]) {
            data[entry.account] = 0.0;
        }

        data[entry.account] += entry.debit - entry.credit;
    }

    return data;
}

async function getAccounts(rootType) {
    return (await frappe.db.getAll({
        doctype: 'Account',
        fields: ['name'],
        filters: {
            rootType
        }
    }))
    .map(d => d.name);
}

module.exports = {
    getData
}