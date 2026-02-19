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
  AccountListNode,
  AccountTreeNode,
  LedgerEntry,
  RawLedgerEntry,
  ReportData,
  ValueMap,
} from 'reports/types';
import { getMapFromList } from 'utils';
import { QueryFilter } from 'utils/db/types';
import { safeParseFloat, safeParseInt } from 'utils/index';

// Extend the Account interface locally to hold our custom "Section" type
interface CashAccount extends AccountTreeNode {
  sectionType: AccountRootType;
}

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

    // 1. Prepare Map with correct Types and Hierarchy for this report
    await this._setAndReturnAccountMap();

    const map = this._getGroupedMap(true, 'account');
    const rangeGroupedMap = await this._getGroupedByDateRanges(map);
    const accountTree = await this._getAccountTree(rangeGroupedMap);

    const cashTree = accountTree as Record<string, CashAccount>;

    // Filter out accounts that shouldn't be in the report
    for (const name of Object.keys(cashTree)) {
      if (!cashTree[name].sectionType) {
        delete cashTree[name];
      }
    }

    const sections: ReportData[] = [];
    const sectionTotals: Record<string, AccountListNode> = {};

    // Helper to process a specific SECTION type
    const processSection = (type: AccountRootType, title: string) => {
      const roots = Object.values(cashTree).filter(
        (n) => n.sectionType === type && !n.parentAccount
      );

      if (!roots || roots.length === 0) return null;

      const list = convertAccountRootNodesToAccountList(roots);
      const rows = this.getReportRowsFromAccountList(list);
      
      const totalNode = this.getTotalNode(roots, t`Total ${title}`);
      sectionTotals[type] = totalNode;

      const totalRow = this.getRowFromAccountListNode(totalNode);
      totalRow.cells.forEach((c) => (c.bold = true));

      return { rows, totalRow };
    };

    // 1. Income Section (Add)
    const incomeData = processSection(AccountRootTypeEnum.Income, t`Income`);
    if (incomeData) {
      sections.push(this.getSectionHeader(t`Income`));
      sections.push(...incomeData.rows, incomeData.totalRow, this.getEmptyRow());
    }

    // 2. Expense Section (Less)
    const expenseData = processSection(AccountRootTypeEnum.Expense, t`Expenses`);
    if (expenseData) {
      sections.push(this.getSectionHeader(t`Expenses`));
      sections.push(...expenseData.rows, expenseData.totalRow, this.getEmptyRow());
    }

    // 3. Net Cash from Operations
    if (incomeData || expenseData) {
      const netOpsRow = this.getCalculatedRow(
        t`Cash Net Profit/Loss`, 
        (vals) => (vals[AccountRootTypeEnum.Income] || 0) - (vals[AccountRootTypeEnum.Expense] || 0),
        sectionTotals
      );
      sections.push(netOpsRow, this.getEmptyRow());
    }

    // 4. Asset Section (Less Increase / Add Decrease)
    const assetData = processSection(AccountRootTypeEnum.Asset, t`Assets`);
    if (assetData) {
      sections.push(this.getSectionHeader(t`Assets (Investing)`));
      sections.push(...assetData.rows, assetData.totalRow, this.getEmptyRow());
    }

    // 5. Liability Section (Add Increase / Less Decrease)
    const liabilityData = processSection(AccountRootTypeEnum.Liability, t`Liabilities`);
    if (liabilityData) {
      sections.push(this.getSectionHeader(t`Liabilities (Financing)`));
      sections.push(...liabilityData.rows, liabilityData.totalRow, this.getEmptyRow());
    }

    // 6. Equity Section (Add Increase / Less Decrease)
    const equityData = processSection(AccountRootTypeEnum.Equity, t`Equity`);
    if (equityData) {
      sections.push(this.getSectionHeader(t`Equity`));
      sections.push(...equityData.rows, equityData.totalRow, this.getEmptyRow());
    }

    // 7. Net Cash Movement (Grand Total)
    // Formula: Income - Expense - AssetChange + LiabilityChange + EquityChange
    const grandTotalRow = this.getCalculatedRow(
      t`Net Cash Movement`,
      (vals) => {
        const inc = vals[AccountRootTypeEnum.Income] || 0;
        const exp = vals[AccountRootTypeEnum.Expense] || 0;
        const ast = vals[AccountRootTypeEnum.Asset] || 0;
        const liab = vals[AccountRootTypeEnum.Liability] || 0;
        const eq = vals[AccountRootTypeEnum.Equity] || 0;
        return inc - exp - ast + liab + eq;
      },
      sectionTotals
    );
    
    grandTotalRow.cells.forEach(c => {
      c.bold = true;
      if (typeof c.rawValue === 'number') {
        c.color = c.rawValue >= 0 ? 'green' : 'red';
      }
    });
    sections.push(grandTotalRow);
    
    // 8. Bank Accounts Summary
    const bankRows = await this.getBankMovementRows();
    if (bankRows.length > 0) {
      sections.push(this.getEmptyRow(), this.getSectionHeader(t`Cash & Bank Changes`));
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

  // Calculates a summary row based on a formula function applied to each column's date range
  getCalculatedRow(
    title: string, 
    formula: (values: Record<string, number>) => number,
    totals: Record<string, AccountListNode>
  ) {
    const valueMap: ValueMap = new Map();

    if (this._dateRanges) {
      for (const range of this._dateRanges) {
        // Gather values for this specific range from all sections
        const rangeVals: Record<string, number> = {};
        for (const [type, node] of Object.entries(totals)) {
          rangeVals[type] = node.valueMap?.get(range)?.balance ?? 0;
        }
        
        // Apply formula
        const result = formula(rangeVals);
        valueMap.set(range, { balance: result });
      }
    }

    const node: AccountListNode = {
      name: title,
      valueMap,
      rootType: AccountRootTypeEnum.Asset, // Dummy type
      isGroup: false,
      parentAccount: null,
      level: 0,
    };

    return this.getRowFromAccountListNode(node);
  }

  async getBankMovementRows(): Promise<ReportData> {
    if (this.cashAccounts.length === 0) return [];

    const filters = await this._getQueryFilters();
    filters.account = ['in', this.cashAccounts];
    // Ensure reverted entries are excluded
    if (filters.reverted === undefined) filters.reverted = false;
    
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

    // Build ValueMaps per account
    const accountValueMaps = new Map<string, ValueMap>();
    const totalValueMap: ValueMap = new Map();

    for (const [account, acEntries] of groupedMap) {
      const vMap: ValueMap = new Map();
      for (const entry of acEntries) {
        const range = this._getRangeMapKey(entry);
        if (!range) continue;

        const current = vMap.get(range)?.balance ?? 0;
        // Bank Logic: Debit = Increase (+), Credit = Decrease (-)
        const change = (entry.debit || 0) - (entry.credit || 0);
        vMap.set(range, { balance: current + change });
      }
      accountValueMaps.set(account, vMap);
    }

    // Calculate Totals per Range
    if (this._dateRanges) {
      for (const range of this._dateRanges) {
        let sum = 0;
        for (const vMap of accountValueMaps.values()) {
          sum += vMap.get(range)?.balance ?? 0;
        }
        totalValueMap.set(range, { balance: sum });
      }
    }

    const rows: ReportData = [];
    const sortedAccounts = [...accountValueMaps.keys()].sort();

    for (const account of sortedAccounts) {
      const node = {
        name: account,
        valueMap: accountValueMaps.get(account),
        rootType: AccountRootTypeEnum.Asset,
        isGroup: false,
        parentAccount: null,
        level: 0,
      };
      rows.push(this.getRowFromAccountListNode(node));
    }

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

  async _setAndReturnAccountMap(force = false) {
    if (this.accountMap && !force) {
      return this.accountMap;
    }

    const accountList = (
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

    // --- RESTRUCTURE TREE ---
    let incomeRoot = '';
    let expenseRoot = '';
    
    for (const name of Object.keys(this.accountMap)) {
      const acc = this.accountMap[name] as CashAccount;
      acc.sectionType = acc.rootType; // Default section

      if (!acc.parentAccount) {
        if (acc.rootType === AccountRootTypeEnum.Income) incomeRoot = name;
        if (acc.rootType === AccountRootTypeEnum.Expense) expenseRoot = name;
      }
    }

    const receivableAccounts = new Set<string>();
    const payableAccounts = new Set<string>();

    for (const name of Object.keys(this.accountMap)) {
      const acc = this.accountMap[name] as any;
      if (acc.accountType === AccountTypeEnum.Receivable) {
        receivableAccounts.add(name);
      } else if (acc.accountType === AccountTypeEnum.Payable) {
        payableAccounts.add(name);
      }
    }

    // Propagate types & Re-parent
    let changed = true;
    while (changed) {
      changed = false;
      for (const name of Object.keys(this.accountMap)) {
        const acc = this.accountMap[name] as CashAccount;
        if (!acc.parentAccount) continue;

        const parent = this.accountMap[acc.parentAccount] as CashAccount;
        if (!parent) continue;

        if (receivableAccounts.has(acc.parentAccount) && !receivableAccounts.has(name)) {
          receivableAccounts.add(name);
          acc.sectionType = AccountRootTypeEnum.Income;
          (acc as any).accountType = AccountTypeEnum.Receivable; 
          changed = true;
        } else if (payableAccounts.has(acc.parentAccount) && !payableAccounts.has(name)) {
          payableAccounts.add(name);
          acc.sectionType = AccountRootTypeEnum.Expense;
          (acc as any).accountType = AccountTypeEnum.Payable;
          changed = true;
        }

        if (acc.sectionType === AccountRootTypeEnum.Income && parent.sectionType !== AccountRootTypeEnum.Income) {
          if (incomeRoot) acc.parentAccount = incomeRoot;
        } else if (acc.sectionType === AccountRootTypeEnum.Expense && parent.sectionType !== AccountRootTypeEnum.Expense) {
          if (expenseRoot) acc.parentAccount = expenseRoot;
        }
      }
    }

    // NOTE: We do NOT force rootType = Income here anymore.
    // We let normal accounting signs prevail (Assets=Debit, Liabilities=Credit)
    // and handle the math in setReportData.

    return this.accountMap;
  }

  async _setRawData() {
    await this._setAndReturnAccountMap();

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

    const queryFilters: QueryFilter = await this._getQueryFilters();
    // Ensure we exclude reverted entries
    if (queryFilters.reverted === undefined) queryFilters.reverted = false;
    
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

    const transactionMap = new Map<string, LedgerEntry[]>();
    for (const entry of typedEntries) {
      const refName = entry.referenceName || `NO_REF_${entry.name}`;
      const key = `${entry.referenceType}::${refName}`;

      if (!transactionMap.has(key)) {
        transactionMap.set(key, []);
      }
      transactionMap.get(key)!.push(entry);
    }

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

    const finalEntries = await this._resolveContraAccounts(cashBasisEntries);
    this._rawData = finalEntries;
  }

  async _resolveContraAccounts(entries: LedgerEntry[]): Promise<LedgerEntry[]> {
    const paymentIds = new Set<string>();
    const entriesToKeep: LedgerEntry[] = [];
    const entriesToResolve: LedgerEntry[] = [];

    for (const entry of entries) {
      const account = this.accountMap?.[entry.account] as CashAccount;
      if (!account) {
        entriesToKeep.push(entry);
        continue;
      }

      const accType = (account as any).accountType;
      // We check against the account types we flagged during map creation
      const isContra = 
        (entry.referenceType === 'Payment' || entry.referenceType === 'SalesInvoice' || entry.referenceType === 'PurchaseInvoice') &&
        (accType === AccountTypeEnum.Receivable || accType === AccountTypeEnum.Payable);

      if (isContra) {
        if (entry.referenceType === 'Payment') paymentIds.add(entry.referenceName);
        entriesToResolve.push(entry);
      } else {
        entriesToKeep.push(entry);
      }
    }

    if (entriesToResolve.length === 0) return entries;

    const paymentAllocations = new Map<string, Array<{invoice: string, amount: number}>>();
    const allInvoiceIds = new Set<string>();

    if (paymentIds.size > 0) {
      try {
        const refs = await this.fyo.db.getAllRaw('PaymentFor', {
          filters: { parent: ['in', Array.from(paymentIds)] },
          fields: ['parent', 'referenceName', 'referenceType', 'amount'],
        });

        for (const ref of refs) {
          if (ref.referenceType === 'SalesInvoice' || ref.referenceType === 'PurchaseInvoice') {
            const pid = ref.parent as string;
            if (!paymentAllocations.has(pid)) paymentAllocations.set(pid, []);
            
            paymentAllocations.get(pid)!.push({
              invoice: ref.referenceName as string,
              amount: safeParseFloat(ref.amount)
            });
            allInvoiceIds.add(ref.referenceName as string);
          }
        }
      } catch (e) { console.warn('Err fetching PaymentFor', e); }
    }

    for (const entry of entriesToResolve) {
      if (entry.referenceType === 'SalesInvoice' || entry.referenceType === 'PurchaseInvoice') {
        allInvoiceIds.add(entry.referenceName);
      }
    }

    if (allInvoiceIds.size === 0) return [...entriesToKeep, ...entriesToResolve];

    const invoiceDistributions = new Map<string, Array<{account: string, ratio: number}>>();
    
    try {
      const glEntries = await this.fyo.db.getAllRaw(
        ModelNameEnum.AccountingLedgerEntry,
        {
          filters: { referenceName: ['in', Array.from(allInvoiceIds)] },
          fields: ['referenceName', 'account', 'debit', 'credit'],
        }
      );

      const invoiceTotals = new Map<string, {total: number, entries: any[]}>();

      for (const gl of glEntries) {
        const id = gl.referenceName as string;
        const account = this.accountMap?.[gl.account as string] as CashAccount;
        if (!account) continue;

        const accType = (account as any).accountType;
        if (accType === AccountTypeEnum.Receivable || accType === AccountTypeEnum.Payable) continue;

        const val = Math.abs(safeParseFloat(gl.debit)) + Math.abs(safeParseFloat(gl.credit));
        if (val === 0) continue;

        if (!invoiceTotals.has(id)) invoiceTotals.set(id, {total: 0, entries: []});
        const rec = invoiceTotals.get(id)!;
        rec.total += val;
        rec.entries.push({ account: gl.account, val });
      }

      for (const [id, data] of invoiceTotals) {
        if (data.total === 0) continue;
        const dist = data.entries.map(e => ({
          account: e.account,
          ratio: e.val / data.total
        }));
        invoiceDistributions.set(id, dist);
      }

    } catch(e) { console.warn('Err building distribution', e); }

    const resolvedEntries: LedgerEntry[] = [];

    for (const entry of entriesToResolve) {
      let allocations: Array<{invoice: string, amount: number}> = [];
      const entryTotal = (entry.debit || 0) + (entry.credit || 0);

      if (entry.referenceType === 'Payment') {
        allocations = paymentAllocations.get(entry.referenceName) || [];
      } else {
        allocations = [{ invoice: entry.referenceName, amount: entryTotal }];
      }

      if (allocations.length === 0) {
        resolvedEntries.push(entry);
        continue;
      }
      
      let allocatedSum = 0;

      for (const alloc of allocations) {
        allocatedSum += alloc.amount;
        const dist = invoiceDistributions.get(alloc.invoice);
        
        if (!dist) {
          resolvedEntries.push({
            ...entry,
            debit: entry.debit ? alloc.amount : 0,
            credit: entry.credit ? alloc.amount : 0
          });
          continue;
        }

        for (const part of dist) {
          const partAmount = alloc.amount * part.ratio;
          resolvedEntries.push({
            ...entry,
            account: part.account as string,
            debit: entry.debit ? partAmount : 0,
            credit: entry.credit ? partAmount : 0
          });
        }
      }

      // Handle unallocated remainder (Partial payments)
      // Floating point tolerance
      if (entryTotal - allocatedSum > 0.01) {
        const remainder = entryTotal - allocatedSum;
        resolvedEntries.push({
          ...entry,
          debit: entry.debit ? remainder : 0,
          credit: entry.credit ? remainder : 0
        });
      }
    }

    return [...entriesToKeep, ...resolvedEntries];
  }
}