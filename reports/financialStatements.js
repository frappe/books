const frappe = require('frappejs');
const { DateTime } = require('luxon');

async function getData({
        rootType,
        balanceMustBe = 'Debit',
        fromDate,
        toDate,
        periodicity = 'Monthly'
    }) {

    const accounts = await getAccounts(rootType);
    if (!accounts || accounts.length === 0) return [];

    const ledgerEntries = await frappe.db.getAll({
        doctype: 'AccountingLedgerEntry',
        fields: ['account', 'debit', 'credit', 'date'],
        filters: {
            account: ['in', accounts],
            date: ['>=', fromDate, '<=', toDate]
        }
    });

    let data = {};

    for (let entry of ledgerEntries) {
        let periodKey = getPeriodKey(entry.date, periodicity);

        if (!data[entry.account]) {
            data[entry.account] = {};
        }

        if (!data[entry.account][periodKey]) {
            data[entry.account][periodKey] = 0.0;
        }

        const multiplier = balanceMustBe === 'Debit' ? 1 : -1;
        data[entry.account][periodKey] += (entry.debit - entry.credit) * multiplier;
    }

    return data;
}

function getPeriodKey(date, periodicity) {
    let key;
    let dateObj = DateTime.fromISO(date);
    let year = dateObj.year;
    let quarter = dateObj.quarter;
    let month = dateObj.month;

    let getKey = {
        'Monthly': () => `${dateObj.monthShort} ${year}`,
        'Quarterly': () => {
            return {
                1: `Jan ${year} - Mar ${year}`,
                2: `Apr ${year} - Jun ${year}`,
                3: `Jun ${year} - Sep ${year}`,
                4: `Oct ${year} - Dec ${year}`
            }[quarter]
        },
        'Half Yearly': () => {
            return {
                1: `Apr ${year} - Sep ${year}`,
                2: `Oct ${year} - Mar ${year}`
            }[[2, 3].includes(quarter) ? 1 : 2]
        },
        'Yearly': () => {
            if (month > 3) {
                return `${year} - ${year + 1}`
            }
            return `${year - 1} - ${year}`
        }
    }[periodicity];

    return getKey();
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
