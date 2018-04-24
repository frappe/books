const frappe = require('frappejs');
const { DateTime } = require('luxon');
const { unique } = require('frappejs/utils');

async function getData({
        rootType,
        balanceMustBe = 'Debit',
        fromDate,
        toDate,
        periodicity = 'Monthly',
        accumulateValues = false
    }) {

    let accounts = await getAccounts(rootType);
    let fiscalYear = await getFiscalYear();
    let ledgerEntries = await getLedgerEntries(fromDate, toDate, accounts);
    let periodList = getPeriodList(fromDate, toDate, periodicity, fiscalYear);

    for (let account of accounts) {
        const entries = ledgerEntries.filter(entry => entry.account === account.name);

        for (let entry of entries) {
            let periodKey = getPeriodKey(entry.date, periodicity);

            if (!account[periodKey]) {
                account[periodKey] = 0.0;
            }

            const multiplier = balanceMustBe === 'Debit' ? 1 : -1;
            const value = (entry.debit - entry.credit) * multiplier
            account[periodKey] += value;
        }
    }

    if (accumulateValues) {
        periodList.forEach((periodKey, i) => {
            if (i === 0) return;
            const previousPeriodKey = periodList[i - 1];

            for (let account of accounts) {
                if (!account[periodKey]) {
                    account[periodKey] = 0.0;
                }
                account[periodKey] += account[previousPeriodKey] || 0.0;
            }
        });
    }

    // calculate totalRow
    let totalRow = {
        account: `Total ${rootType} (${balanceMustBe})`
    };

    periodList.forEach((periodKey) => {
        if (!totalRow[periodKey]) {
            totalRow[periodKey] = 0.0;
        }

        for (let account of accounts) {
            totalRow[periodKey] += account[periodKey] || 0.0;
        }
    });

    return { accounts, totalRow, periodList };
}

function getPeriodList(fromDate, toDate, periodicity, fiscalYear) {
    if (!fromDate) {
        fromDate = fiscalYear.start;
    }

    let monthsToAdd = {
        'Monthly': 1,
        'Quarterly': 3,
        'Half Yearly': 6,
        'Yearly': 12
    }[periodicity];

    let startDate = DateTime.fromISO(fromDate).startOf('month');
    let endDate = DateTime.fromISO(toDate).endOf('month');
    let curDate = startDate;
    let out = [];

    while (curDate <= endDate) {
        out.push(getPeriodKey(curDate, periodicity));
        curDate = curDate.plus({ months: monthsToAdd });
    }

    return out;
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

function setIndentLevel(accounts, parentAccount, level) {
    if (!parentAccount) {
        // root
        parentAccount = null;
        level = 0;
    }

    accounts.forEach(account => {
        if (account.parentAccount === parentAccount && account.indent === undefined) {
            account.indent = level;
            setIndentLevel(accounts, account.name, level + 1);
        }
    });

    return accounts;
}

function sortAccounts(accounts) {
    let out = [];
    let pushed = {};

    pushToOut(null);

    function pushToOut(parentAccount) {
        accounts.forEach(account => {
            if (account.parentAccount === parentAccount && !pushed[account.name]) {
                out.push(account);
                pushed[account.name] = 1;

                pushToOut(account.name);
            }
        })
    }

    return out;
}

async function getLedgerEntries(fromDate, toDate, accounts) {
    const dateFilter = () => {
        const before = ['<=', toDate];
        const after = ['>=', fromDate];
        if (fromDate) {
            return [...after, ...before];
        }
        return before;
    }

    const ledgerEntries = await frappe.db.getAll({
        doctype: 'AccountingLedgerEntry',
        fields: ['account', 'debit', 'credit', 'date'],
        filters: {
            account: ['in', accounts.map(d => d.name)],
            date: dateFilter()
        }
    });

    return ledgerEntries;
}

async function getAccounts(rootType) {
    let accounts = await frappe.db.getAll({
        doctype: 'Account',
        fields: ['name', 'parentAccount'],
        filters: {
            rootType
        }
    });

    accounts = setIndentLevel(accounts);
    accounts = sortAccounts(accounts);

    accounts.forEach(account => {
        account.account = account.name;
    });

    return accounts;
}

async function getFiscalYear() {
    let { fiscalYearStart, fiscalYearEnd } = await frappe.getSingle('AccountingSettings');
    return {
        start: fiscalYearStart,
        end: fiscalYearEnd
    };
}

module.exports = {
    getData
}
