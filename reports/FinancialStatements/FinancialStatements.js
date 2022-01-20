import frappe from 'frappe';
import { DateTime } from 'luxon';
import { convertPesaValuesToFloat } from '../../src/utils';

export async function getData({
  rootType,
  balanceMustBe = 'Debit',
  fromDate,
  toDate,
  periodicity = 'Monthly',
  accumulateValues = false,
}) {
  let accounts = await getAccounts(rootType);
  let fiscalYear = await getFiscalYear();
  let ledgerEntries = await getLedgerEntries(fromDate, toDate, accounts);
  let periodList = getPeriodList(fromDate, toDate, periodicity, fiscalYear);

  for (let account of accounts) {
    const entries = ledgerEntries.filter(
      (entry) => entry.account === account.name
    );

    for (let entry of entries) {
      let periodKey = getPeriodKey(entry.date, periodicity);

      if (!account[periodKey]) {
        account[periodKey] = frappe.pesa(0.0);
      }

      const multiplier = balanceMustBe === 'Debit' ? 1 : -1;
      const value = entry.debit.sub(entry.credit).mul(multiplier);
      account[periodKey] = value.add(account[periodKey]);
    }
  }

  if (accumulateValues) {
    periodList.forEach((periodKey, i) => {
      if (i === 0) return;
      const previousPeriodKey = periodList[i - 1];

      for (let account of accounts) {
        if (!account[periodKey]) {
          account[periodKey] = frappe.pesa(0.0);
        }

        account[periodKey] = account[periodKey].add(
          account[previousPeriodKey] ?? 0
        );
      }
    });
  }

  // calculate totalRow
  let totalRow = {
    account: `Total ${rootType} (${balanceMustBe})`,
  };

  periodList.forEach((periodKey) => {
    if (!totalRow[periodKey]) {
      totalRow[periodKey] = frappe.pesa(0.0);
    }

    for (let account of accounts) {
      totalRow[periodKey] = totalRow[periodKey].add(account[periodKey] ?? 0.0);
    }
  });

  convertPesaValuesToFloat(totalRow);
  accounts.forEach(convertPesaValuesToFloat);

  return { accounts, totalRow, periodList };
}

export async function getTrialBalance({ rootType, fromDate, toDate }) {
  let accounts = await getAccounts(rootType);
  let ledgerEntries = await getLedgerEntries(null, toDate, accounts);

  for (let account of accounts) {
    const accountEntries = ledgerEntries.filter(
      (entry) => entry.account === account.name
    );
    // opening
    const beforePeriodEntries = accountEntries.filter(
      (entry) => entry.date < fromDate
    );
    account.opening = beforePeriodEntries.reduce(
      (acc, entry) => acc.add(entry.debit).sub(entry.credit),
      frappe.pesa(0)
    );

    if (account.opening.gte(0)) {
      account.openingDebit = account.opening;
      account.openingCredit = frappe.pesa(0);
    } else {
      account.openingCredit = account.opening.neg();
      account.openingDebit = frappe.pesa(0);
    }

    // debit / credit
    const periodEntries = accountEntries.filter(
      (entry) => entry.date >= fromDate && entry.date < toDate
    );
    account.debit = periodEntries.reduce(
      (acc, entry) => acc.add(entry.debit),
      frappe.pesa(0)
    );
    account.credit = periodEntries.reduce(
      (acc, entry) => acc.add(entry.credit),
      frappe.pesa(0)
    );

    // closing
    account.closing = account.opening.add(account.debit).sub(account.credit);

    if (account.closing.gte(0)) {
      account.closingDebit = account.closing;
      account.closingCredit = frappe.pesa(0);
    } else {
      account.closingCredit = account.closing.neg();
      account.closingDebit = frappe.pesa(0);
    }

    if (account.debit.neq(0) || account.credit.neq(0)) {
      setParentEntry(account, account.parentAccount);
    }
  }

  function setParentEntry(leafAccount, parentName) {
    for (let acc of accounts) {
      if (acc.name === parentName) {
        acc.debit = acc.debit.add(leafAccount.debit);
        acc.credit = acc.credit.add(leafAccount.credit);
        acc.closing = acc.opening.add(acc.debit).sub(acc.credit);
        if (acc.closing.gte(0)) {
          acc.closingDebit = acc.closing;
        } else {
          acc.closingCredit = acc.closing.neg();
        }
        if (acc.parentAccount) {
          setParentEntry(leafAccount, acc.parentAccount);
        } else {
          return;
        }
      }
    }
  }

  accounts.forEach(convertPesaValuesToFloat);
  return accounts;
}

export function getPeriodList(fromDate, toDate, periodicity, fiscalYear) {
  if (!fromDate) {
    fromDate = fiscalYear.start;
  }

  let monthsToAdd = {
    Monthly: 1,
    Quarterly: 3,
    'Half Yearly': 6,
    Yearly: 12,
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
    Monthly: () => `${dateObj.monthShort} ${year}`,
    Quarterly: () => {
      return {
        1: `Jan ${year} - Mar ${year}`,
        2: `Apr ${year} - Jun ${year}`,
        3: `Jun ${year} - Sep ${year}`,
        4: `Oct ${year} - Dec ${year}`,
      }[quarter];
    },
    'Half Yearly': () => {
      if (month > 3) {
        return {
          1: `Apr ${year} - Sep ${year}`,
          2: `Oct ${year} - Mar ${year + 1}`,
        }[[2, 3].includes(quarter) ? 1 : 2];
      }
      return `Oct ${year - 1} - Mar ${year}`;
    },
    Yearly: () => {
      if (month > 3) {
        return `${year} - ${year + 1}`;
      }
      return `${year - 1} - ${year}`;
    },
  }[periodicity];

  return getKey();
}

function setIndentLevel(accounts, parentAccount, level) {
  if (!parentAccount) {
    // root
    parentAccount = null;
    level = 0;
  }

  accounts.forEach((account) => {
    if (
      account.parentAccount === parentAccount &&
      account.indent === undefined
    ) {
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
    accounts.forEach((account) => {
      if (account.parentAccount === parentAccount && !pushed[account.name]) {
        out.push(account);
        pushed[account.name] = 1;

        pushToOut(account.name);
      }
    });
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
  };

  const ledgerEntries = await frappe.db.getAll({
    doctype: 'AccountingLedgerEntry',
    fields: ['account', 'debit', 'credit', 'date'],
    filters: {
      account: ['in', accounts.map((d) => d.name)],
      date: dateFilter(),
    },
  });

  return ledgerEntries;
}

async function getAccounts(rootType) {
  let accounts = await frappe.db.getAll({
    doctype: 'Account',
    fields: ['name', 'parentAccount', 'isGroup'],
    filters: {
      rootType,
    },
  });

  accounts = setIndentLevel(accounts);
  accounts = sortAccounts(accounts);

  accounts.forEach((account) => {
    account.account = account.name;
  });

  return accounts;
}

async function getFiscalYear() {
  let { fiscalYearStart, fiscalYearEnd } = await frappe.getSingle(
    'AccountingSettings'
  );
  return {
    start: fiscalYearStart,
    end: fiscalYearEnd,
  };
}

export default {
  getData,
  getTrialBalance,
  getPeriodList,
};
