import { Fyo } from 'fyo';
import { DocValueMap } from 'fyo/core/types';
import { DateTime } from 'luxon';
import { AccountRootType } from 'models/baseModels/Account/types';
import Money from 'pesa/dist/types/src/money';
import {
  BalanceType,
  FinancialStatementOptions,
  Periodicity,
} from 'reports/types';
import { convertPesaValuesToFloat } from 'src/utils';

interface FiscalYear {
  start: string;
  end: string;
  quarters: number[];
  isSplit: number;
}

interface AccountInfo extends DocValueMap {
  name: string;
  parentAccount: string;
  isGroup: boolean;
  account?: string;
  indent?: number;
}

interface LedgerInfo extends DocValueMap {
  account: string;
  debit: Money;
  credit: Money;
  date: string;
}

export class FinancialStatements {
  fyo: Fyo;
  constructor(fyo: Fyo) {
    this.fyo = fyo;
  }

  async getData(options: FinancialStatementOptions) {
    const rootType = options.rootType;
    const balanceMustBe = options.balanceMustBe ?? 'Debit';
    const fromDate = options.fromDate;
    const toDate = options.toDate;
    const periodicity = options.periodicity ?? 'Monthly';
    const accumulateValues = options.accumulateValues ?? false;

    const accounts = await this.getAccounts(rootType);
    const fiscalYear = await getFiscalYear(this.fyo);
    const ledgerEntries = await this.getLedgerEntries(
      fromDate,
      toDate,
      accounts
    );
    const periodList = getPeriodList(fromDate, toDate, periodicity, fiscalYear);
    this.setPeriodAmounts(
      accounts,
      ledgerEntries,
      periodicity,
      fiscalYear,
      balanceMustBe
    );

    if (accumulateValues) {
      this.accumulateValues(accounts, periodList);
    }

    const totalRow = this.getTotalRow(
      rootType,
      balanceMustBe,
      periodList,
      accounts
    );
    accounts.forEach(convertPesaValuesToFloat);

    return { accounts, totalRow, periodList };
  }

  setPeriodAmounts(
    accounts: AccountInfo[],
    ledgerEntries: LedgerInfo[],
    periodicity: Periodicity,
    fiscalYear: FiscalYear,
    balanceMustBe: BalanceType
  ) {
    for (const account of accounts) {
      const entries = ledgerEntries.filter(
        (entry) => entry.account === account.name
      );

      for (const entry of entries) {
        const periodKey = getPeriodKey(entry.date, periodicity, fiscalYear);

        if (account[periodKey] === undefined) {
          account[periodKey] = this.fyo.pesa(0.0);
        }

        const multiplier = balanceMustBe === 'Debit' ? 1 : -1;
        const value = entry.debit.sub(entry.credit).mul(multiplier);
        account[periodKey] = value.add(account[periodKey] as Money);
      }
    }
  }

  getTotalRow(
    rootType: AccountRootType,
    balanceMustBe: BalanceType,
    periodList: string[],
    accounts: AccountInfo[]
  ) {
    const totalRow: DocValueMap = {
      account: `Total ${rootType} (${balanceMustBe})`,
    };

    periodList.forEach((periodKey) => {
      if (totalRow[periodKey] === undefined) {
        totalRow[periodKey] = this.fyo.pesa(0.0);
      }

      for (const account of accounts) {
        totalRow[periodKey] = (totalRow[periodKey] as Money).add(
          (account[periodKey] as Money) ?? 0.0
        );
      }
    });

    convertPesaValuesToFloat(totalRow);
    return totalRow;
  }

  async accumulateValues(accounts: AccountInfo[], periodList: string[]) {
    periodList.forEach((periodKey, i) => {
      if (i === 0) {
        return;
      }

      const previousPeriodKey = periodList[i - 1];

      for (const account of accounts) {
        if (!account[periodKey]) {
          account[periodKey] = this.fyo.pesa(0.0);
        }

        account[periodKey] = (account[periodKey] as Money).add(
          (account[previousPeriodKey] as Money | undefined) ?? 0
        );
      }
    });
  }

  async getAccounts(rootType: AccountRootType) {
    let accounts = (await this.fyo.db.getAll('Account', {
      fields: ['name', 'parentAccount', 'isGroup'],
      filters: {
        rootType,
      },
    })) as AccountInfo[];

    accounts = setIndentLevel(accounts);
    accounts = sortAccounts(accounts);

    accounts.forEach((account) => {
      account.account = account.name;
    });

    return accounts;
  }

  async getLedgerEntries(
    fromDate: string | null,
    toDate: string,
    accounts: AccountInfo[]
  ) {
    const accountFilter = ['in', accounts.map((d) => d.name)];
    let dateFilter: string[] = ['<=', toDate];
    if (fromDate) {
      dateFilter = ['>=', fromDate, '<=', toDate];
    }

    const ledgerEntries = (await this.fyo.db.getAll('AccountingLedgerEntry', {
      fields: ['account', 'debit', 'credit', 'date'],
      filters: {
        account: accountFilter,
        date: dateFilter,
      },
    })) as LedgerInfo[];

    return ledgerEntries;
  }

  async getTrialBalance(options: FinancialStatementOptions) {
    const { rootType, fromDate, toDate } = options;
    const accounts = await this.getAccounts(rootType);
    const ledgerEntries = await this.getLedgerEntries(null, toDate, accounts);

    for (const account of accounts) {
      const accountEntries = ledgerEntries.filter(
        (entry) => entry.account === account.name
      );
      // opening
      const beforePeriodEntries = accountEntries.filter(
        (entry) => entry.date < fromDate
      );

      account.opening = beforePeriodEntries.reduce(
        (acc, entry) => acc.add(entry.debit).sub(entry.credit),
        this.fyo.pesa(0)
      );

      if (account.opening.gte(0)) {
        account.openingDebit = account.opening;
        account.openingCredit = this.fyo.pesa(0);
      } else {
        account.openingCredit = account.opening.neg();
        account.openingDebit = this.fyo.pesa(0);
      }

      // debit / credit
      const periodEntries = accountEntries.filter(
        (entry) => entry.date >= fromDate && entry.date < toDate
      );
      account.debit = periodEntries.reduce(
        (acc, entry) => acc.add(entry.debit),
        this.fyo.pesa(0)
      );
      account.credit = periodEntries.reduce(
        (acc, entry) => acc.add(entry.credit),
        this.fyo.pesa(0)
      );

      // closing
      account.closing = account.opening.add(account.debit).sub(account.credit);

      if (account.closing.gte(0)) {
        account.closingDebit = account.closing;
        account.closingCredit = this.fyo.pesa(0);
      } else {
        account.closingCredit = account.closing.neg();
        account.closingDebit = this.fyo.pesa(0);
      }

      if (account.debit.neq(0) || account.credit.neq(0)) {
        setParentEntry(account, account.parentAccount);
      }
    }

    function setParentEntry(leafAccount: AccountInfo, parentName: string) {
      for (const acc of accounts) {
        if (acc.name === parentName) {
          acc.debit = (acc.debit as Money).add(leafAccount.debit as Money);
          acc.credit = (acc.credit as Money).add(leafAccount.credit as Money);
          acc.closing = (acc.opening as Money).add(acc.debit).sub(acc.credit);

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
}

function setIndentLevel(
  accounts: AccountInfo[],
  parentAccount?: string | null,
  level?: number
): AccountInfo[] {
  if (parentAccount === undefined) {
    parentAccount = null;
    level = 0;
  }

  accounts.forEach((account) => {
    if (
      account.parentAccount === parentAccount &&
      account.indent === undefined
    ) {
      account.indent = level;
      setIndentLevel(accounts, account.name, (level ?? 0) + 1);
    }
  });

  return accounts;
}

function sortAccounts(accounts: AccountInfo[]) {
  const out: AccountInfo[] = [];
  const pushed: Record<string, boolean> = {};

  pushToOut(null);

  function pushToOut(parentAccount: string | null) {
    accounts.forEach((account) => {
      if (pushed[account.name] && account.parentAccount !== parentAccount) {
        return;
      }

      out.push(account);
      pushed[account.name] = true;

      pushToOut(account.name);
    });
  }

  return out;
}

export function getPeriodList(
  fromDate: string,
  toDate: string,
  periodicity: Periodicity,
  fiscalYear: FiscalYear
) {
  if (!fromDate) {
    fromDate = fiscalYear.start;
  }

  const monthsToAdd = {
    Monthly: 1,
    Quarterly: 3,
    'Half Yearly': 6,
    Yearly: 12,
  }[periodicity];

  const startDate = DateTime.fromISO(fromDate).startOf('month');
  const endDate = DateTime.fromISO(toDate).endOf('month');
  let curDate = startDate;
  const periodKeyList: string[] = [];

  while (curDate <= endDate) {
    const periodKey = getPeriodKey(curDate, periodicity, fiscalYear);
    periodKeyList.push(periodKey);
    curDate = curDate.plus({ months: monthsToAdd });
  }

  return periodKeyList;
}

function getPeriodKey(
  dateObj: DateTime | string,
  periodicity: Periodicity,
  fiscalYear: FiscalYear
) {
  if (typeof dateObj === 'string') {
    dateObj = DateTime.fromISO(dateObj);
  }

  const { start, quarters, isSplit } = fiscalYear;
  const { month, year } = dateObj;
  const fisacalStart = DateTime.fromISO(start);

  if (periodicity === 'Monthly') {
    return `${dateObj.monthShort} ${year}`;
  }

  if (periodicity === 'Quarterly') {
    const key =
      month < fisacalStart.month
        ? `${year - 1} - ${year}`
        : `${year} - ${year + 1}`;
    const strYear = isSplit ? key : `${year}`;
    return {
      1: `Q1 ${strYear}`,
      2: `Q2 ${strYear}`,
      3: `Q3 ${strYear}`,
      4: `Q4 ${strYear}`,
    }[quarters[month - 1]] as string;
  }

  if (periodicity === 'Half Yearly') {
    const key =
      month < fisacalStart.month
        ? `${year - 1} - ${year}`
        : `${year} - ${year + 1}`;
    const strYear = isSplit ? key : `${year}`;
    return {
      1: `1st Half ${strYear}`,
      2: `1st Half ${strYear}`,
      3: `2nd Half ${strYear}`,
      4: `2nd Half ${strYear}`,
    }[quarters[month - 1]] as string;
  }

  const key =
    month < fisacalStart.month
      ? `${year - 1} - ${year}`
      : `${year} - ${year + 1}`;
  const strYear = isSplit ? key : `${year}`;
  return `FY ${strYear}`;
}

export async function getFiscalYear(fyo: Fyo): Promise<FiscalYear> {
  const accountingSettings = await fyo.doc.getSingle('AccountingSettings');

  const fiscalYearStart = accountingSettings.fiscalYearStart as string;
  const fiscalYearEnd = accountingSettings.fiscalYearEnd as string;

  //right now quaters received from luxon lib is fixed to Jan as starting quarter
  //moving the financial quarters, according to of start of fiscal year month
  const quarters = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4];
  const start = DateTime.fromISO(fiscalYearStart);
  quarters.unshift(...quarters.splice(13 - start.month, 11));

  //check if fiscal year ends in next year
  const end = DateTime.fromISO(fiscalYearEnd);
  const isFiscalSplit = start.year - end.year;

  return {
    start: fiscalYearStart,
    end: fiscalYearEnd,
    quarters: quarters,
    isSplit: isFiscalSplit,
  };
}
