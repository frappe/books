import { t } from 'fyo';
import {
  AccountRootType,
  AccountRootTypeEnum,
  AccountTypeEnum,
} from 'models/baseModels/Account/types';
import { ModelNameEnum } from 'models/types';
import {
  AccountReport,
  convertAccountRootNodesToAccountList,
} from 'reports/AccountReport';
import {
  Account,
  AccountListNode,
  LedgerEntry,
  RawLedgerEntry,
  ReportData,
  ValueMap,
} from 'reports/types';
import { getMapFromList } from 'utils';
import { QueryFilter } from 'utils/db/types';
import { safeParseFloat, safeParseInt } from 'utils/index';

export class CashMovement extends AccountReport {
  static title = t`Cash Movement`;
  static reportName = 'cash-movement';
  loading = false;
  cashAccounts: string[] = [];

  get rootTypes(): AccountRootType[] {
    return [
      AccountRootTypeEnum.Income,
      AccountRootTypeEnum.Expense,
      AccountRootTypeEnum.Asset,
      AccountRootTypeEnum.Liability,
      AccountRootTypeEnum.Equity,
    ];
  }

  async setReportData(filter?: string, force?: boolean) {
    this.loading = true;
    if (force || filter !== 'hideGroupAmounts') {
      await this._setRawData();
    }

    const map = this._getGroupedMap(true, 'account');
    const rangeGroupedMap = await this._getGroupedByDateRanges(map);
    const accountTree = await this._getAccountTree(rangeGroupedMap);

    // Remap Receivables to Income and Payables to Expense
    for (const name of Object.keys(accountTree)) {
      const node = accountTree[name] as any;
      if (node.accountType === AccountTypeEnum.Receivable) {
        node.rootType = AccountRootTypeEnum.Income;
      } else if (node.accountType === AccountTypeEnum.Payable) {
        node.rootType = AccountRootTypeEnum.Expense;
      }
    }

    // Filter out accounts not in rootTypes
    for (const name of Object.keys(accountTree)) {
      const { rootType } = accountTree[name];
      if (this.rootTypes.includes(rootType)) {
        continue;
      }
      delete accountTree[name];
    }

    const sections: ReportData[] = [];
    const totals: Record<string, AccountListNode> = {};

    // Helper to process a specific root type
    const processRootType = (type: AccountRootType, title: string) => {
      const roots = this.getRootNodes(type, accountTree);
      if (!roots || roots.length === 0) return null;

      const list = convertAccountRootNodesToAccountList(roots);
      const rows = this.getReportRowsFromAccountList(list);
      const totalNode = this.getTotalNode(roots, t`Total ${title}`);
      const totalRow = this.getRowFromAccountListNode(totalNode);
      totalRow.cells.forEach((c) => (c.bold = true));

      totals[type] = totalNode;

      return { rows, totalRow };
    };

    // 1. Income Section
    const incomeData = processRootType(AccountRootTypeEnum.Income, t`Income`);
    if (incomeData) {
      sections.push(this.getSectionHeader(t`Income`));
      sections.push(
        ...incomeData.rows,
        incomeData.totalRow,
        this.getEmptyRow()
      );
    }

    // 2. Expense Section
    const expenseData = processRootType(
      AccountRootTypeEnum.Expense,
      t`Expenses`
    );
    if (expenseData) {
      sections.push(this.getSectionHeader(t`Expenses`));
      sections.push(
        ...expenseData.rows,
        expenseData.totalRow,
        this.getEmptyRow()
      );
    }

    // 3. Net Profit / Net Cash Movement from Operations
    if (
      totals[AccountRootTypeEnum.Income] ||
      totals[AccountRootTypeEnum.Expense]
    ) {
      const netProfitRow = this.getNetProfitRow(
        totals[AccountRootTypeEnum.Income],
        totals[AccountRootTypeEnum.Expense]
      );
      sections.push([netProfitRow], this.getEmptyRow());
    }

    // 4. Asset Section
    const assetData = processRootType(AccountRootTypeEnum.Asset, t`Assets`);
    if (assetData) {
      sections.push(this.getSectionHeader(t`Assets`));
      sections.push(...assetData.rows, assetData.totalRow, this.getEmptyRow());
    }

    // 5. Liability Section
    const liabilityData = processRootType(
      AccountRootTypeEnum.Liability,
      t`Liabilities`
    );
    if (liabilityData) {
      sections.push(this.getSectionHeader(t`Liabilities`));
      sections.push(
        ...liabilityData.rows,
        liabilityData.totalRow,
        this.getEmptyRow()
      );
    }

    // 6. Equity Section
    const equityData = processRootType(AccountRootTypeEnum.Equity, t`Equity`);
    if (equityData) {
      sections.push(this.getSectionHeader(t`Equity`));
      sections.push(
        ...equityData.rows,
        equityData.totalRow,
        this.getEmptyRow()
      );
    }

    // 7. Bank Accounts Summary
    const bankRows = await this.getBankMovementRows();
    if (bankRows.length > 0) {
      sections.push(this.getSectionHeader(t`Cash & Bank`));
      sections.push(...bankRows);
    }

    this.reportData = sections.flat();
    this.loading = false;
  }

  getSectionHeader(title: string) {
    const row = this.getEmptyRow();
    row.cells[0].value = title;
    row.cells[0].bold = true;
    return [row];
  }

  getNetProfitRow(incomeNode?: AccountListNode, expenseNode?: AccountListNode) {
    const valueMap: ValueMap = new Map();

    for (const range of this._dateRanges!) {
      const income = incomeNode?.valueMap?.get(range)?.balance ?? 0;
      const expense = expenseNode?.valueMap?.get(range)?.balance ?? 0;
      valueMap.set(range, { balance: income - expense });
    }

    const node: AccountListNode = {
      name: t`Cash Net Profit`,
      valueMap,
      rootType: AccountRootTypeEnum.Equity, // Dummy type
      isGroup: false,
      parentAccount: null,
      level: 0,
    };

    const row = this.getRowFromAccountListNode(node);
    row.cells.forEach((c) => {
      c.bold = true;
      if (typeof c.rawValue === 'number') {
        c.color = c.rawValue >= 0 ? 'green' : 'red';
      }
    });
    return row;
  }

  async getBankMovementRows(): Promise<ReportData> {
    if (this.cashAccounts.length === 0) return [];

    const filters = await this._getQueryFilters();
    // We want the actual bank entries now, not contra
    filters.account = ['in', this.cashAccounts];

    // Clone filters to remove any proxies before passing to DB
    const filtersClone = JSON.parse(JSON.stringify(filters));

    const fields = ['name', 'account', 'date', 'debit', 'credit'];

    const rawEntries = (await this.fyo.db.getAllRaw(
      ModelNameEnum.AccountingLedgerEntry,
      { filters: filtersClone, fields }
    )) as RawLedgerEntry[];

    const entries = rawEntries.map(
      (e) =>
        ({
          ...e,
          date: new Date(e.date),
          debit: Math.abs(safeParseFloat(e.debit)),
          credit: Math.abs(safeParseFloat(e.credit)),
        } as LedgerEntry)
    );

    const groupedMap = new Map<string, LedgerEntry[]>();
    for (const entry of entries) {
      if (!groupedMap.has(entry.account)) {
        groupedMap.set(entry.account, []);
      }
      groupedMap.get(entry.account)!.push(entry);
    }

    const valueMaps = await this._getGroupedByDateRanges(groupedMap);
    const sortedAccounts = [...valueMaps.keys()].sort();

    const rows: ReportData = [];
    const totalValueMap = new Map<any, any>();

    for (const account of sortedAccounts) {
      const valueMap = valueMaps.get(account)!;

      // Accumulate totals for the section
      for (const [range, val] of valueMap) {
        const current = totalValueMap.get(range)?.balance ?? 0;
        totalValueMap.set(range, { balance: current + val.balance });
      }

      const node = {
        name: account,
        valueMap,
        rootType: AccountRootTypeEnum.Asset,
        isGroup: false,
        parentAccount: null,
        level: 0,
      };
      rows.push(this.getRowFromAccountListNode(node));
    }

    // Add Total Row for Bank Section
    const totalNode = {
      name: t`Total Cash Change`,
      valueMap: totalValueMap,
      rootType: AccountRootTypeEnum.Asset,
      isGroup: false,
      parentAccount: null,
      level: 0,
    };
    const totalRow = this.getRowFromAccountListNode(totalNode);
    totalRow.cells.forEach((c) => (c.bold = true));
    rows.push(totalRow);

    return rows;
  }

  /**
   * Override to include accountType in the account map
   */
  async _setAndReturnAccountMap(force = false) {
    if (this.accountMap && !force) {
      return this.accountMap;
    }

    const accountList: Account[] = (
      await this.fyo.db.getAllRaw('Account', {
        fields: [
          'name',
          'rootType',
          'isGroup',
          'parentAccount',
          'accountType',
        ],
      })
    ).map(
      (rv) =>
        ({
          name: rv.name as string,
          rootType: rv.rootType as AccountRootType,
          isGroup: Boolean(rv.isGroup),
          parentAccount: rv.parentAccount as string | null,
          accountType: rv.accountType as AccountTypeEnum,
        } as any)
    );

    this.accountMap = getMapFromList(accountList, 'name');
    return this.accountMap;
  }

  /**
   * Overrides AccountReport._setRawData to fetch only entries that are counterparts
   * to Bank/Cash transactions.
   */
  async _setRawData() {
    // 1. Get all Bank and Cash accounts
    this.cashAccounts = (
      await this.fyo.db.getAllRaw('Account', {
        filters: {
          accountType: ['in', [AccountTypeEnum.Bank, AccountTypeEnum.Cash]],
        },
        fields: ['name'],
      })
    ).map((a: any) => a.name);

    if (this.cashAccounts.length === 0) {
      this._rawData = [];
      return;
    }

    // 2. Fetch all entries within the date range
    const queryFilters: QueryFilter = await this._getQueryFilters();
    // Clone filters to remove any proxies before passing to DB
    const filtersClone = JSON.parse(JSON.stringify(queryFilters));

    const fields = [
      'name',
      'account',
      'date',
      'debit',
      'credit',
      'referenceType',
      'referenceName',
      'party',
      'reverted',
      'reverts',
    ];

    const rawEntries = (await this.fyo.db.getAllRaw(
      ModelNameEnum.AccountingLedgerEntry,
      {
        filters: filtersClone,
        fields,
        orderBy: ['date', 'created'],
      }
    )) as RawLedgerEntry[];

    // 3. Map RawLedgerEntry to LedgerEntry
    const typedEntries: LedgerEntry[] = rawEntries.map((entry) => {
      return {
        name: safeParseInt(entry.name),
        account: entry.account,
        date: new Date(entry.date),
        debit: Math.abs(safeParseFloat(entry.debit)),
        credit: Math.abs(safeParseFloat(entry.credit)),
        balance: 0,
        referenceType: entry.referenceType,
        referenceName: entry.referenceName,
        party: entry.party,
        reverted: Boolean(entry.reverted),
        reverts: entry.reverts,
      } as LedgerEntry;
    });

    // 4. Group entries by Transaction
    const transactionMap = new Map<string, LedgerEntry[]>();
    for (const entry of typedEntries) {
      const refName = entry.referenceName || `NO_REF_${entry.name}`;
      const key = `${entry.referenceType}::${refName}`;

      if (!transactionMap.has(key)) {
        transactionMap.set(key, []);
      }
      transactionMap.get(key)!.push(entry);
    }

    // 5. Filter for transactions that involve Cash/Bank, and extract the CONTRA entries
    const cashBasisEntries: LedgerEntry[] = [];

    for (const entries of transactionMap.values()) {
      const hasCashImpact = entries.some((e) =>
        this.cashAccounts.includes(e.account)
      );

      if (hasCashImpact) {
        const contraEntries = entries.filter(
          (e) => !this.cashAccounts.includes(e.account)
        );
        cashBasisEntries.push(...contraEntries);
      }
    }

    this._rawData = cashBasisEntries;
  }
}