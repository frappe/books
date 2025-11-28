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

  // We want to fetch all types, but we will organize them differently
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

    // Cast tree nodes to our custom type for easier access
    const cashTree = accountTree as Record<string, CashAccount>;

    // Filter out accounts that shouldn't be in the report
    // (If it wasn't assigned a sectionType in _setAndReturnAccountMap, ignore it)
    for (const name of Object.keys(cashTree)) {
      if (!cashTree[name].sectionType) {
        delete cashTree[name];
      }
    }

    const sections: ReportData[] = [];
    const totals: Record<string, number> = {};

    // Helper to process a specific SECTION type (not rootType, which is now 'Income' for all)
    const processSection = (type: AccountRootType, title: string) => {
      // Find root nodes for this Section
      const roots = Object.values(cashTree).filter(
        (n) => n.sectionType === type && !n.parentAccount
      );

      if (!roots || roots.length === 0) return null;

      const list = convertAccountRootNodesToAccountList(roots);
      const rows = this.getReportRowsFromAccountList(list);
      const totalNode = this.getTotalNode(roots, t`Total ${title}`);
      
      // Store total for Summary
      const totalVal = [...(totalNode.valueMap?.values() || [])].reduce((acc, v) => acc + v.balance, 0);
      totals[type] = totalVal;

      const totalRow = this.getRowFromAccountListNode(totalNode);
      totalRow.cells.forEach((c) => (c.bold = true));

      return { rows, totalRow };
    };

    // 1. Income Section
    const incomeData = processSection(AccountRootTypeEnum.Income, t`Income`);
    if (incomeData) {
      sections.push(this.getSectionHeader(t`Income`));
      sections.push(...incomeData.rows, incomeData.totalRow, this.getEmptyRow());
    }

    // 2. Expense Section
    const expenseData = processSection(AccountRootTypeEnum.Expense, t`Expenses`);
    if (expenseData) {
      sections.push(this.getSectionHeader(t`Expenses`));
      sections.push(...expenseData.rows, expenseData.totalRow, this.getEmptyRow());
    }

    // 3. Net Cash from Operations (Income + Expense)
    // Note: Since Expenses are now negative numbers, we just add them.
    if (incomeData || expenseData) {
      const netOps = (totals[AccountRootTypeEnum.Income] || 0) + (totals[AccountRootTypeEnum.Expense] || 0);
      sections.push(this.getSummaryRow(t`Net Cash from Operations`, netOps), this.getEmptyRow());
    }

    // 4. Asset Section (Investing)
    const assetData = processSection(AccountRootTypeEnum.Asset, t`Assets`);
    if (assetData) {
      sections.push(this.getSectionHeader(t`Assets (Investing)`));
      sections.push(...assetData.rows, assetData.totalRow, this.getEmptyRow());
    }

    // 5. Liability Section (Financing)
    const liabilityData = processSection(AccountRootTypeEnum.Liability, t`Liabilities (Financing)`);
    if (liabilityData) {
      sections.push(this.getSectionHeader(t`Liabilities (Financing)`));
      sections.push(...liabilityData.rows, liabilityData.totalRow, this.getEmptyRow());
    }

    // 6. Equity Section
    const equityData = processSection(AccountRootTypeEnum.Equity, t`Equity`);
    if (equityData) {
      sections.push(this.getSectionHeader(t`Equity`));
      sections.push(...equityData.rows, equityData.totalRow, this.getEmptyRow());
    }

    // 7. Net Cash Movement (Grand Total)
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    sections.push(this.getSummaryRow(t`Net Cash Movement`, grandTotal));
    
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

  getSummaryRow(title: string, balance: number) {
    const row = this.getEmptyRow();
    const cells = row.cells;
    cells[0].value = title;
    cells[0].bold = true;

    // Place the value in the last column (Totals column)
    // Assuming the last column is where we want the total. 
    // In multi-column reports (by month), this simple summary might be visually off, 
    // but correct for the aggregate. Ideally, we would sum per-column.
    const lastIdx = cells.length - 1;
    cells[lastIdx].rawValue = balance;
    cells[lastIdx].value = this.fyo.format(balance, 'Currency');
    cells[lastIdx].bold = true;
    
    // Color coding
    if (balance >= 0) cells[lastIdx].color = 'green';
    else cells[lastIdx].color = 'red';

    return [row]; 
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

    const rows: ReportData = [];
    let totalMovement = 0;

    const sortedAccounts = [...groupedMap.keys()].sort();

    for (const account of sortedAccounts) {
      const acEntries = groupedMap.get(account)!;
      // Calculate Net Movement: Debit (In) - Credit (Out) for BANK
      // This is standard asset logic, not our forced Income logic.
      let balance = 0;
      for (const e of acEntries) {
        balance += (e.debit || 0) - (e.credit || 0);
      }
      totalMovement += balance;

      const row = this.getEmptyRow();
      row.cells[0].value = account;
      const colIdx = row.cells.length - 1;
      row.cells[colIdx].rawValue = balance;
      row.cells[colIdx].value = this.fyo.format(balance, 'Currency');
      rows.push(row);
    }

    const totalRow = this.getEmptyRow();
    totalRow.cells[0].value = t`Total Cash Change`;
    totalRow.cells[0].bold = true;
    const lastIdx = totalRow.cells.length - 1;
    totalRow.cells[lastIdx].rawValue = totalMovement;
    totalRow.cells[lastIdx].value = this.fyo.format(totalMovement, 'Currency');
    totalRow.cells[lastIdx].bold = true;
    
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

    // --- RESTRUCTURE TREE AND FORCE SIGNS ---
    
    let incomeRoot = '';
    let expenseRoot = '';
    
    // 1. Identify roots and initialize custom 'sectionType'
    for (const name of Object.keys(this.accountMap)) {
      const acc = this.accountMap[name] as CashAccount;
      acc.sectionType = acc.rootType; // Default section is original root

      if (!acc.parentAccount) {
        if (acc.rootType === AccountRootTypeEnum.Income) incomeRoot = name;
        if (acc.rootType === AccountRootTypeEnum.Expense) expenseRoot = name;
      }
    }

    const receivableAccounts = new Set<string>();
    const payableAccounts = new Set<string>();

    // 2. Identify explicitly typed accounts
    for (const name of Object.keys(this.accountMap)) {
      const acc = this.accountMap[name] as any;
      if (acc.accountType === AccountTypeEnum.Receivable) {
        receivableAccounts.add(name);
      } else if (acc.accountType === AccountTypeEnum.Payable) {
        payableAccounts.add(name);
      }
    }

    // 3. Propagate types & Re-parent
    let changed = true;
    while (changed) {
      changed = false;
      for (const name of Object.keys(this.accountMap)) {
        const acc = this.accountMap[name] as CashAccount;
        if (!acc.parentAccount) continue;

        const parent = this.accountMap[acc.parentAccount] as CashAccount;
        if (!parent) continue;

        // Propagate Receivable -> Income Section
        if (receivableAccounts.has(acc.parentAccount) && !receivableAccounts.has(name)) {
          receivableAccounts.add(name);
          acc.sectionType = AccountRootTypeEnum.Income;
          (acc as any).accountType = AccountTypeEnum.Receivable; 
          changed = true;
        } 
        // Propagate Payable -> Expense Section
        else if (payableAccounts.has(acc.parentAccount) && !payableAccounts.has(name)) {
          payableAccounts.add(name);
          acc.sectionType = AccountRootTypeEnum.Expense;
          (acc as any).accountType = AccountTypeEnum.Payable;
          changed = true;
        }

        // Apply explicit re-parenting for Tree Structure in report
        if (acc.sectionType === AccountRootTypeEnum.Income && parent.sectionType !== AccountRootTypeEnum.Income) {
          if (incomeRoot) acc.parentAccount = incomeRoot;
        } else if (acc.sectionType === AccountRootTypeEnum.Expense && parent.sectionType !== AccountRootTypeEnum.Expense) {
          if (expenseRoot) acc.parentAccount = expenseRoot;
        }
      }
    }

    // 4. GLOBAL FORCE: Set rootType = Income for EVERYONE to standardize signage
    for (const name of Object.keys(this.accountMap)) {
      const acc = this.accountMap[name];
      acc.rootType = AccountRootTypeEnum.Income;
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

      // Identify entries that are purely Debtors/Creditors placeholders
      const accType = (account as any).accountType;
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

        // Skip the Debtor/Creditor line to find the real Income/Expense lines
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

      // Handle unallocated payments (Payment on Account)
      // Or if no allocations found at all.
      if (allocations.length === 0) {
        resolvedEntries.push(entry);
        continue;
      }
      
      let allocatedSum = 0;

      for (const alloc of allocations) {
        allocatedSum += alloc.amount;
        const dist = invoiceDistributions.get(alloc.invoice);
        
        if (!dist) {
          // Allocation points to invoice we couldn't resolve -> Keep as generic portion
          resolvedEntries.push({
            ...entry,
            debit: entry.debit ? alloc.amount : 0,
            credit: entry.credit ? alloc.amount : 0
          });
          continue;
        }

        // Split this allocation based on invoice distribution
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

      // CRITICAL FIX: Handle Remainder (Partial Allocations)
      // If payment was 100 but only 80 allocated, keep 20 as "Debtors" (Payment on Account)
      // Floating point tolerance check
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