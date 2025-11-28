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

    // 1. Prepare Map with correct Types and Hierarchy for this report
    await this._setAndReturnAccountMap();

    const map = this._getGroupedMap(true, 'account');
    const rangeGroupedMap = await this._getGroupedByDateRanges(map);
    const accountTree = await this._getAccountTree(rangeGroupedMap);

    // Filter out accounts that are not in our target list
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

    // 3. Net Profit / Net Cash Movement
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
      name: t`Net Cash Movement`,
      valueMap,
      rootType: AccountRootTypeEnum.Equity,
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
    filters.account = ['in', this.cashAccounts];
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

    let incomeRoot = '';
    let expenseRoot = '';
    
    for (const name of Object.keys(this.accountMap)) {
      const acc = this.accountMap[name];
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
        acc.rootType = AccountRootTypeEnum.Income;
      } else if (acc.accountType === AccountTypeEnum.Payable) {
        payableAccounts.add(name);
        acc.rootType = AccountRootTypeEnum.Expense;
      }
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const name of Object.keys(this.accountMap)) {
        const acc = this.accountMap[name] as any;
        if (!acc.parentAccount) continue;

        const parent = this.accountMap[acc.parentAccount];
        if (!parent) continue;

        if (receivableAccounts.has(acc.parentAccount) && !receivableAccounts.has(name)) {
          receivableAccounts.add(name);
          acc.rootType = AccountRootTypeEnum.Income;
          // Tag as Receivable so resolution logic skips it
          acc.accountType = AccountTypeEnum.Receivable; 
          changed = true;
        } else if (payableAccounts.has(acc.parentAccount) && !payableAccounts.has(name)) {
          payableAccounts.add(name);
          acc.rootType = AccountRootTypeEnum.Expense;
          // Tag as Payable so resolution logic skips it
          acc.accountType = AccountTypeEnum.Payable;
          changed = true;
        }

        if (acc.rootType === AccountRootTypeEnum.Income && parent.rootType !== AccountRootTypeEnum.Income) {
          if (incomeRoot) acc.parentAccount = incomeRoot;
        } else if (acc.rootType === AccountRootTypeEnum.Expense && parent.rootType !== AccountRootTypeEnum.Expense) {
          if (expenseRoot) acc.parentAccount = expenseRoot;
        }
      }
    }

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

    // Resolve allocations and replace "Debtors" with real categories
    const finalEntries = await this._resolveContraAccounts(cashBasisEntries);
    this._rawData = finalEntries;
  }

  async _resolveContraAccounts(entries: LedgerEntry[]): Promise<LedgerEntry[]> {
    const paymentIds = new Set<string>();
    const entriesToKeep: LedgerEntry[] = [];
    const entriesToResolve: LedgerEntry[] = [];

    for (const entry of entries) {
      const account = this.accountMap?.[entry.account];
      if (!account) {
        entriesToKeep.push(entry);
        continue;
      }

      // Check for generic "Debtors"/"Creditors" entries that need resolution
      const isContra = 
        (entry.referenceType === 'Payment' || entry.referenceType === 'SalesInvoice' || entry.referenceType === 'PurchaseInvoice') &&
        (account.rootType === AccountRootTypeEnum.Income || account.rootType === AccountRootTypeEnum.Expense) &&
        ((account as any).accountType === AccountTypeEnum.Receivable || (account as any).accountType === AccountTypeEnum.Payable);

      if (isContra) {
        if (entry.referenceType === 'Payment') paymentIds.add(entry.referenceName);
        entriesToResolve.push(entry);
      } else {
        entriesToKeep.push(entry);
      }
    }

    if (entriesToResolve.length === 0) return entries;

    // 1. Map Payment -> Invoices (and amount allocated)
    const paymentAllocations = new Map<string, Array<{invoice: string, amount: number, type: string}>>();
    const allInvoiceIds = new Set<string>();

    if (paymentIds.size > 0) {
      try {
        const refs = await this.fyo.db.getAllRaw('PaymentFor', {
          filters: { parent: ['in', Array.from(paymentIds)] },
          fields: ['parent', 'referenceName', 'referenceType', 'amount'],
        });

        for (const ref of refs) {
          const type = ref.referenceType as string;
          if (type === 'SalesInvoice' || type === 'PurchaseInvoice') {
            const pid = ref.parent as string;
            if (!paymentAllocations.has(pid)) paymentAllocations.set(pid, []);
            
            paymentAllocations.get(pid)!.push({
              invoice: ref.referenceName as string,
              amount: safeParseFloat(ref.amount),
              type: type
            });
            allInvoiceIds.add(ref.referenceName as string);
          }
        }
      } catch (e) { console.warn('Err fetching PaymentFor', e); }
    }

    // Add directly referenced invoices to the set
    for (const entry of entriesToResolve) {
      if (entry.referenceType === 'SalesInvoice' || entry.referenceType === 'PurchaseInvoice') {
        allInvoiceIds.add(entry.referenceName);
      }
    }

    if (allInvoiceIds.size === 0) return [...entriesToKeep, ...entriesToResolve]; // No invoices found

    // 2. Build Invoice Account Distributions
    // InvoiceID -> [ { account: 'Sales', weight: 0.9 }, { account: 'Tax', weight: 0.1 } ]
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
        const account = this.accountMap?.[gl.account as string];
        if (!account) continue;

        // Determine if this line is part of the "Contra" side (e.g. Sales, Tax)
        // For Sales Invoice (Income), we look for Credits.
        // For Purchase Invoice (Expense), we look for Debits.
        // We skip the Receivable/Payable account itself.
        
        const accType = (account as any).accountType;
        const isReceivable = accType === AccountTypeEnum.Receivable;
        const isPayable = accType === AccountTypeEnum.Payable;

        if (isReceivable || isPayable) continue; // Skip the debtor/creditor line

        const val = Math.abs(safeParseFloat(gl.debit)) + Math.abs(safeParseFloat(gl.credit));
        if (val === 0) continue;

        if (!invoiceTotals.has(id)) invoiceTotals.set(id, {total: 0, entries: []});
        const rec = invoiceTotals.get(id)!;
        rec.total += val;
        rec.entries.push({ account: gl.account, val });
      }

      // Convert to ratios
      for (const [id, data] of invoiceTotals) {
        if (data.total === 0) continue;
        const dist = data.entries.map(e => ({
          account: e.account,
          ratio: e.val / data.total
        }));
        invoiceDistributions.set(id, dist);
      }

    } catch(e) { console.warn('Err building distribution', e); }

    // 3. Resolve and Split Entries
    const resolvedEntries: LedgerEntry[] = [];

    for (const entry of entriesToResolve) {
      // Determine which invoice(s) this entry pays for
      let allocations: Array<{invoice: string, amount: number}> = [];

      if (entry.referenceType === 'Payment') {
        allocations = paymentAllocations.get(entry.referenceName) || [];
      } else {
        // Direct link
        const val = (entry.debit || 0) + (entry.credit || 0);
        allocations = [{ invoice: entry.referenceName, amount: val }];
      }

      if (allocations.length === 0) {
        // Unallocated payment -> Keep original (Debtors)
        resolvedEntries.push(entry);
        continue;
      }

      // If we have allocations, we split this entry
      // Note: The original entry amount might match the sum of allocations, or differ (if partial/overpayment).
      // We should generally respect the allocations found.
      
      for (const alloc of allocations) {
        const dist = invoiceDistributions.get(alloc.invoice);
        if (!dist) {
          // Allocation points to invoice we couldn't resolve -> Keep as generic portion?
          // Or map to "Unresolved". Let's keep original account for this portion.
          resolvedEntries.push({
            ...entry,
            debit: entry.debit ? alloc.amount : 0,
            credit: entry.credit ? alloc.amount : 0
          });
          continue;
        }

        // Split based on invoice distribution
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
    }

    return [...entriesToKeep, ...resolvedEntries];
  }
}