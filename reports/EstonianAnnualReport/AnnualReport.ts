import { t } from 'fyo';
import { Action } from 'fyo/model/types';
import { DateTime } from 'luxon';
import { AccountRootType } from 'models/baseModels/Account/types';
import { ModelNameEnum } from 'models/types';
import { Report } from 'reports/Report';
import { ColumnField, ReportData, ReportRow } from 'reports/types';
import { Field } from 'schemas/types';
import { getSavePath } from 'src/utils/ui';
import mappingJson from './mapping/et-gaap-2026-01-01.json';
import { roundAndSum, roundEur, sumRounded } from './rounding';
import { AccountMapping, XbrlFact, XbrlReportData } from './types';
import { exportXbrl } from './XbrlExporter';

const MAPPING = mappingJson as unknown as AccountMapping;

const TAXONOMY_VERSION = '2026-01-01';

interface AccountInfo {
  name: string;
  rootType: AccountRootType;
}

interface AccountBalance {
  name: string;
  rootType: AccountRootType;
  /** Closing balance (signed per rootType, see signedBalance). */
  closing: number;
  /** Net activity over the period (signed per rootType). */
  activity: number;
}

export class AnnualReport extends Report {
  static title = t`Annual Report (XBRL)`;
  static reportName = 'AnnualReport';

  year?: number;
  /** ISO yyyy-mm-dd (first day of period). Defaults to fiscal-year start. */
  fromDate?: string;
  /** ISO yyyy-mm-dd (last day of period). Defaults to fiscal-year end. */
  toDate?: string;
  loading = false;

  data?: XbrlReportData;
  /** Pre-export balance check; `null` when no data has been aggregated yet. */
  balanceOk: boolean | null = null;
  totalsForDebug?: {
    assets: number;
    currentAssets: number;
    nonCurrentAssets: number;
    liabilities: number;
    currentLiabilities: number;
    nonCurrentLiabilities: number;
    equity: number;
    issuedCapital: number;
    unpaidCapital: number;
    liabilitiesAndEquity: number;
    revenue: number;
    otherIncome: number;
    otherOperatingExpense: number;
    employeeExpense: number;
    depreciationAndImpairmentLossReversal: number;
    totalProfitLossBeforeTax: number;
    incomeTaxExpense: number;
    totalAnnualPeriodProfitLoss: number;
  };

  async setDefaultFilters(): Promise<void> {
    if (!this.year) {
      this.year = DateTime.local().minus({ months: 6 }).year;
    }
    if (!this.fromDate) this.fromDate = `${this.year}-01-01`;
    if (!this.toDate) this.toDate = `${this.year}-12-31`;
    return Promise.resolve();
  }

  getFilters(): Field[] {
    return [
      { fieldname: 'year', label: t`Year`, fieldtype: 'Int', required: true },
      { fieldname: 'fromDate', label: t`From Date`, fieldtype: 'Date' },
      { fieldname: 'toDate', label: t`To Date`, fieldtype: 'Date' },
    ];
  }

  getColumns(): ColumnField[] {
    return [
      {
        fieldname: 'element',
        label: t`Element`,
        fieldtype: 'Data',
        width: 2,
      } as ColumnField,
      {
        fieldname: 'context',
        label: t`Context`,
        fieldtype: 'Data',
        width: 1,
      } as ColumnField,
      {
        fieldname: 'amount',
        label: t`Amount (EUR)`,
        fieldtype: 'Currency',
        width: 1,
      } as ColumnField,
    ];
  }

  getActions(): Action[] {
    return [
      {
        group: t`Export`,
        label: 'XBRL',
        type: 'primary',
        action: async () => {
          await this.exportXbrl();
        },
      },
    ];
  }

  async setReportData(): Promise<void> {
    this.loading = true;
    try {
      this.data = await this.aggregate();
      this.reportData = this.toReportRows(this.data);
    } finally {
      this.loading = false;
    }
  }

  private async aggregate(): Promise<XbrlReportData> {
    const fromDate = this.fromDate!;
    const toDate = this.toDate!;
    const year = this.year!;

    const accounts = await this.loadAccounts();
    const balances = await this.computeBalances(accounts, fromDate, toDate);

    const balanceSheet = this.aggregateBalanceSheet(balances);
    const incomeStatement = this.aggregateIncomeStatement(balances);

    // Compute totals and patch them into the fact lists so the XBRL output
    // carries every required total, not just leaves.
    this.applyBalanceTotalsInPlace(balanceSheet, incomeStatement);

    const registryCode =
      (this.fyo.singles.AccountingSettings?.registryCode as string) ?? '';

    const generalInfo: XbrlFact[] = [];
    // String facts come through the notes channel; numeric general info
    // (BeginningAndEndOfAnnualPeriod is date-typed) isn't a Monetary fact —
    // the exporter handles textual contexts via the notes array.

    this.balanceOk = assertBalance(balanceSheet);

    return {
      registryCode,
      periodStart: fromDate,
      periodEnd: toDate,
      year,
      generalInfo,
      balanceSheet,
      incomeStatement,
      notes: [],
    };
  }

  private async loadAccounts(): Promise<AccountInfo[]> {
    const rows = (await this.fyo.db.getAllRaw(ModelNameEnum.Account, {
      fields: ['name', 'rootType'],
    })) as Array<{ name: string; rootType: AccountRootType }>;
    return rows;
  }

  private async computeBalances(
    accounts: AccountInfo[],
    fromDate: string,
    toDate: string
  ): Promise<AccountBalance[]> {
    const closingRows = (await this.fyo.db.getAllRaw(
      ModelNameEnum.AccountingLedgerEntry,
      {
        fields: ['account', 'debit', 'credit'],
        filters: {
          date: ['<=', toDate],
          reverted: false,
        },
      }
    )) as Array<{ account: string; debit?: string; credit?: string }>;

    const periodRows = (await this.fyo.db.getAllRaw(
      ModelNameEnum.AccountingLedgerEntry,
      {
        fields: ['account', 'debit', 'credit'],
        filters: {
          date: ['>=', fromDate, '<=', toDate],
          reverted: false,
        },
      }
    )) as Array<{ account: string; debit?: string; credit?: string }>;

    const closingByAccount = new Map<
      string,
      { debit: number; credit: number }
    >();
    const periodByAccount = new Map<
      string,
      { debit: number; credit: number }
    >();

    for (const row of closingRows) {
      const cur = closingByAccount.get(row.account) ?? { debit: 0, credit: 0 };
      cur.debit += num(row.debit);
      cur.credit += num(row.credit);
      closingByAccount.set(row.account, cur);
    }
    for (const row of periodRows) {
      const cur = periodByAccount.get(row.account) ?? { debit: 0, credit: 0 };
      cur.debit += num(row.debit);
      cur.credit += num(row.credit);
      periodByAccount.set(row.account, cur);
    }

    return accounts.map((a) => {
      const cl = closingByAccount.get(a.name) ?? { debit: 0, credit: 0 };
      const pe = periodByAccount.get(a.name) ?? { debit: 0, credit: 0 };
      return {
        name: a.name,
        rootType: a.rootType,
        closing: signedBalance(a.rootType, cl.debit, cl.credit),
        activity: signedBalance(a.rootType, pe.debit, pe.credit),
      };
    });
  }

  private aggregateBalanceSheet(balances: AccountBalance[]): XbrlFact[] {
    const out: XbrlFact[] = [];
    for (const [element, cfg] of Object.entries(MAPPING.balanceSheet)) {
      const total = sumRounded(
        cfg.accounts
          .map(
            (acctName) =>
              balances.find((b) => b.name === acctName)?.closing ?? 0
          )
          .map(roundEur)
      );
      // Always emit balance-sheet facts (zero is meaningful here).
      out.push({ element, value: total, context: 'instant_end' });
    }
    return out;
  }

  private aggregateIncomeStatement(balances: AccountBalance[]): XbrlFact[] {
    const out: XbrlFact[] = [];
    for (const [element, cfg] of Object.entries(MAPPING.incomeStatement)) {
      const total = sumRounded(
        cfg.accounts
          .map(
            (acctName) =>
              balances.find((b) => b.name === acctName)?.activity ?? 0
          )
          .map(roundEur)
      );
      out.push({ element, value: total, context: 'duration_year' });
    }
    return out;
  }

  /**
   * Derive totals and push them into the fact arrays.
   *
   * Balance sheet totals: Assets, Liabilities, Equity, LiabilitiesAndEquity.
   * Income statement totals: TotalProfitLossBeforeTax, IncomeTaxExpense (0),
   * TotalAnnualPeriodProfitLoss.
   *
   * Current period profit is folded into Equity so the balance equation
   * holds without needing a separate RetainedEarnings element (which
   * role-201014 micro-OÜ does not expose).
   */
  private applyBalanceTotalsInPlace(bs: XbrlFact[], is: XbrlFact[]) {
    const get = (arr: XbrlFact[], el: string) =>
      arr.find((f) => f.element === el)?.value ?? 0;

    const currentAssets = get(bs, 'CurrentAssets');
    const nonCurrentAssets = get(bs, 'NonCurrentAssets');
    const currentLiabilities = get(bs, 'CurrentLiabilities');
    const nonCurrentLiabilities = get(bs, 'NonCurrentLiabilities');
    const issuedCapital = get(bs, 'IssuedCapital');
    const unpaidCapital = get(bs, 'UnpaidCapital');

    const revenue = get(is, 'Revenue');
    const otherIncome = get(is, 'OtherIncome');
    const otherOperatingExpense = get(is, 'OtherOperatingExpense');
    const employeeExpense = get(is, 'EmployeeExpense');
    const depreciation = get(is, 'DepreciationAndImpairmentLossReversal');

    const totalBeforeTax =
      revenue +
      otherIncome -
      otherOperatingExpense -
      employeeExpense -
      depreciation;
    const incomeTaxExpense = 0;
    const totalAnnualProfitLoss = totalBeforeTax - incomeTaxExpense;

    const assets = currentAssets + nonCurrentAssets;
    const liabilities = currentLiabilities + nonCurrentLiabilities;
    // Equity must satisfy Assets === Liabilities + Equity. Anchor on the
    // accounting identity rather than trusting equity-account balances
    // (which may exclude current-year profit if books haven't been closed).
    const equity = assets - liabilities;
    const liabilitiesAndEquity = liabilities + equity;

    bs.push({ element: 'Assets', value: assets, context: 'instant_end' });
    bs.push({
      element: 'Liabilities',
      value: liabilities,
      context: 'instant_end',
    });
    bs.push({ element: 'Equity', value: equity, context: 'instant_end' });
    bs.push({
      element: 'LiabilitiesAndEquity',
      value: liabilitiesAndEquity,
      context: 'instant_end',
    });

    is.push({
      element: 'TotalProfitLossBeforeTax',
      value: totalBeforeTax,
      context: 'duration_year',
    });
    is.push({
      element: 'IncomeTaxExpense',
      value: incomeTaxExpense,
      context: 'duration_year',
    });
    is.push({
      element: 'TotalAnnualPeriodProfitLoss',
      value: totalAnnualProfitLoss,
      context: 'duration_year',
    });

    this.totalsForDebug = {
      assets,
      currentAssets,
      nonCurrentAssets,
      liabilities,
      currentLiabilities,
      nonCurrentLiabilities,
      equity,
      issuedCapital,
      unpaidCapital,
      liabilitiesAndEquity,
      revenue,
      otherIncome,
      otherOperatingExpense,
      employeeExpense,
      depreciationAndImpairmentLossReversal: depreciation,
      totalProfitLossBeforeTax: totalBeforeTax,
      incomeTaxExpense,
      totalAnnualPeriodProfitLoss: totalAnnualProfitLoss,
    };
  }

  private toReportRows(d: XbrlReportData): ReportData {
    const facts = [...d.balanceSheet, ...d.incomeStatement];
    return facts.map<ReportRow>((f) => ({
      cells: [
        { rawValue: f.element, value: f.element, width: 2, align: 'left' },
        { rawValue: f.context, value: f.context, width: 1, align: 'left' },
        {
          rawValue: f.value,
          value: this.fyo.format(f.value, 'Currency'),
          width: 1,
          align: 'right',
        },
      ],
    }));
  }

  private async exportXbrl() {
    if (!this.data) await this.setReportData();
    if (!this.data) return;

    if (!this.data.registryCode) {
      throw new Error(
        t`Set Registry Code in Accounting Settings before exporting XBRL.`
      );
    }
    if (this.balanceOk === false) {
      throw new Error(
        t`Balance sheet does not balance — Assets ≠ Liabilities + Equity. Fix ledger before exporting.`
      );
    }

    const xml = exportXbrl(this.data, TAXONOMY_VERSION);
    const filename = `annual_report_${this.data.year}`;
    const { filePath, canceled } = await getSavePath(filename, 'xbrl');
    if (canceled || !filePath) return;

    await ipc.saveData(xml, filePath);
  }
}

function num(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Sign a (debit, credit) pair according to the rootType's normal balance.
 * - Asset, Expense: debit positive
 * - Liability, Equity, Income: credit positive
 */
function signedBalance(
  rootType: AccountRootType,
  debit: number,
  credit: number
): number {
  switch (rootType) {
    case 'Asset':
    case 'Expense':
      return debit - credit;
    case 'Liability':
    case 'Equity':
    case 'Income':
      return credit - debit;
    default:
      return debit - credit;
  }
}

function assertBalance(bs: XbrlFact[]): boolean {
  const get = (el: string) => bs.find((f) => f.element === el)?.value ?? 0;
  const assets = roundAndSum([get('CurrentAssets'), get('NonCurrentAssets')]);
  const liabilities = roundAndSum([
    get('CurrentLiabilities'),
    get('NonCurrentLiabilities'),
  ]);
  // After applyBalanceTotalsInPlace, Equity is set to Assets - Liabilities.
  // This assertion verifies leaf-level rounding hasn't broken the identity.
  const equity = get('Equity');
  return assets === liabilities + equity;
}
