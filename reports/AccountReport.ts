import { Fyo, t } from 'fyo';
import { cloneDeep } from 'lodash';
import { DateTime } from 'luxon';
import { AccountRootType } from 'models/baseModels/Account/types';
import { isCredit } from 'models/helpers';
import { ModelNameEnum } from 'models/types';
import { LedgerReport } from 'reports/LedgerReport';
import {
  Account,
  AccountList,
  AccountListNode,
  AccountNameValueMapMap,
  AccountTree,
  AccountTreeNode,
  BasedOn,
  ColumnField,
  DateRange,
  GroupedMap,
  LedgerEntry,
  Periodicity,
  ReportCell,
  ReportData,
  ReportRow,
  Tree,
  TreeNode,
  ValueMap,
} from 'reports/types';
import { Field } from 'schemas/types';
import { getMapFromList } from 'utils';
import { QueryFilter } from 'utils/db/types';

export const ACC_NAME_WIDTH = 2;
export const ACC_BAL_WIDTH = 1.25;

export abstract class AccountReport extends LedgerReport {
  toDate?: string;
  count = 3;
  fromYear?: number;
  toYear?: number;
  consolidateColumns = false;
  hideGroupAmounts = false;
  periodicity: Periodicity = 'Monthly';
  basedOn: BasedOn = 'Until Date';

  _rawData: LedgerEntry[] = [];
  _dateRanges?: DateRange[];

  accountMap?: Record<string, Account>;

  async setDefaultFilters(): Promise<void> {
    if (this.basedOn === 'Until Date' && !this.toDate) {
      this.toDate = DateTime.now().plus({ days: 1 }).toISODate();
    }

    if (this.basedOn === 'Fiscal Year' && !this.toYear) {
      this.fromYear = DateTime.now().year;
      this.toYear = this.fromYear + 1;
    }

    await this._setDateRanges();
  }

  async _setDateRanges() {
    this._dateRanges = await this._getDateRanges();
  }

  getRootNode(
    rootType: AccountRootType,
    accountTree: AccountTree
  ): AccountTreeNode | undefined {
    const rootNodeList = Object.values(accountTree);
    return rootNodeList.find((n) => n.rootType === rootType);
  }

  getEmptyRow(): ReportRow {
    const columns = this.getColumns();
    return {
      isEmpty: true,
      cells: columns.map(
        (c) =>
          ({
            value: '',
            rawValue: '',
            width: c.width,
            align: 'left',
          } as ReportCell)
      ),
    };
  }

  getTotalNode(rootNode: AccountTreeNode, name: string): AccountListNode {
    const accountTree = { [rootNode.name]: rootNode };
    const leafNodes = getListOfLeafNodes(accountTree) as AccountTreeNode[];

    const totalMap = leafNodes.reduce((acc, node) => {
      for (const key of this._dateRanges!) {
        const bal = acc.get(key)?.balance ?? 0;
        const val = node.valueMap?.get(key)?.balance ?? 0;
        acc.set(key, { balance: bal + val });
      }

      return acc;
    }, new Map() as ValueMap);

    return { name, valueMap: totalMap, level: 0 } as AccountListNode;
  }

  getReportRowsFromAccountList(accountList: AccountList): ReportData {
    return accountList.map((al) => {
      return this.getRowFromAccountListNode(al);
    });
  }

  getRowFromAccountListNode(al: AccountListNode) {
    const nameCell = {
      value: al.name,
      rawValue: al.name,
      align: 'left',
      width: ACC_NAME_WIDTH,
      bold: !al.level,
      indent: al.level ?? 0,
    } as ReportCell;

    const balanceCells = this._dateRanges!.map((k) => {
      const rawValue = al.valueMap?.get(k)?.balance ?? 0;
      let value = this.fyo.format(rawValue, 'Currency');
      if (this.hideGroupAmounts && al.isGroup) {
        value = '';
      }

      return {
        rawValue,
        value,
        align: 'right',
        width: ACC_BAL_WIDTH,
      } as ReportCell;
    });

    return {
      cells: [nameCell, balanceCells].flat(),
      level: al.level,
      isGroup: !!al.isGroup,
      folded: false,
      foldedBelow: false,
    } as ReportRow;
  }

  async _getGroupedByDateRanges(
    map: GroupedMap
  ): Promise<AccountNameValueMapMap> {
    const accountValueMap: AccountNameValueMapMap = new Map();
    if (!this.accountMap) {
      await this._setAndReturnAccountMap();
    }

    for (const account of map.keys()) {
      const valueMap: ValueMap = new Map();

      /**
       * Set Balance for every DateRange key
       */
      for (const entry of map.get(account)!) {
        const key = this._getRangeMapKey(entry);
        if (key === null) {
          continue;
        }

        if (!this.accountMap?.[entry.account]) {
          await this._setAndReturnAccountMap(true);
        }

        const totalBalance = valueMap.get(key)?.balance ?? 0;
        const balance = (entry.debit ?? 0) - (entry.credit ?? 0);
        const rootType = this.accountMap![entry.account]?.rootType;

        if (isCredit(rootType)) {
          valueMap.set(key, { balance: totalBalance - balance });
        } else {
          valueMap.set(key, { balance: totalBalance + balance });
        }
      }
      accountValueMap.set(account, valueMap);
    }

    return accountValueMap;
  }

  async _getAccountTree(rangeGroupedMap: AccountNameValueMapMap) {
    const accountTree = cloneDeep(
      await this._setAndReturnAccountMap()
    ) as AccountTree;

    setPruneFlagOnAccountTreeNodes(accountTree);
    setValueMapOnAccountTreeNodes(accountTree, rangeGroupedMap);
    setChildrenOnAccountTreeNodes(accountTree);
    deleteNonRootAccountTreeNodes(accountTree);
    pruneAccountTree(accountTree);

    return accountTree;
  }

  async _setAndReturnAccountMap(force = false) {
    if (this.accountMap && !force) {
      return this.accountMap;
    }

    const accountList: Account[] = (
      await this.fyo.db.getAllRaw('Account', {
        fields: ['name', 'rootType', 'isGroup', 'parentAccount'],
      })
    ).map((rv) => ({
      name: rv.name as string,
      rootType: rv.rootType as AccountRootType,
      isGroup: Boolean(rv.isGroup),
      parentAccount: rv.parentAccount as string | null,
    }));

    this.accountMap = getMapFromList(accountList, 'name');
    return this.accountMap;
  }

  _getRangeMapKey(entry: LedgerEntry): DateRange | null {
    const entryDate = DateTime.fromISO(
      entry.date!.toISOString().split('T')[0]
    ).toMillis();

    for (const dr of this._dateRanges!) {
      const toDate = dr.toDate.toMillis();
      const fromDate = dr.fromDate.toMillis();

      if (entryDate >= fromDate && entryDate < toDate) {
        return dr;
      }
    }

    return null;
  }

  async _getDateRanges(): Promise<DateRange[]> {
    const endpoints = await this._getFromAndToDates();
    const fromDate = DateTime.fromISO(endpoints.fromDate);
    const toDate = DateTime.fromISO(endpoints.toDate);

    if (this.consolidateColumns) {
      return [
        {
          toDate,
          fromDate,
        },
      ];
    }

    const months: number = monthsMap[this.periodicity];
    const dateRanges: DateRange[] = [
      { toDate, fromDate: toDate.minus({ months }) },
    ];

    let count = this.count ?? 1;
    if (this.basedOn === 'Fiscal Year') {
      count = Math.ceil(((this.toYear! - this.fromYear!) * 12) / months);
    }

    for (let i = 1; i < count; i++) {
      const lastRange = dateRanges.at(-1)!;
      dateRanges.push({
        toDate: lastRange.fromDate,
        fromDate: lastRange.fromDate.minus({ months }),
      });
    }

    return dateRanges.sort((b, a) => b.toDate.toMillis() - a.toDate.toMillis());
  }

  async _getFromAndToDates() {
    let toDate: string;
    let fromDate: string;

    if (this.basedOn === 'Until Date') {
      toDate = DateTime.fromISO(this.toDate!).plus({ days: 1 }).toISODate();
      const months = monthsMap[this.periodicity] * Math.max(this.count ?? 1, 1);
      fromDate = DateTime.fromISO(this.toDate!).minus({ months }).toISODate();
    } else {
      const fy = await getFiscalEndpoints(
        this.toYear!,
        this.fromYear!,
        this.fyo
      );
      toDate = DateTime.fromISO(fy.toDate).plus({ days: 1 }).toISODate();
      fromDate = fy.fromDate;
    }

    return { fromDate, toDate };
  }

  async _getQueryFilters(): Promise<QueryFilter> {
    const filters: QueryFilter = {};
    const { fromDate, toDate } = await this._getFromAndToDates();

    const dateFilter: string[] = [];
    dateFilter.push('<', toDate);
    dateFilter.push('>=', fromDate);

    filters.date = dateFilter;
    filters.reverted = false;
    return filters;
  }

  getFilters(): Field[] {
    const periodNameMap: Record<Periodicity, string> = {
      Monthly: t`Months`,
      Quarterly: t`Quarters`,
      'Half Yearly': t`Half Years`,
      Yearly: t`Years`,
    };

    const filters = [
      {
        fieldtype: 'Select',
        options: [
          { label: t`Fiscal Year`, value: 'Fiscal Year' },
          { label: t`Until Date`, value: 'Until Date' },
        ],
        label: t`Based On`,
        fieldname: 'basedOn',
      },
      {
        fieldtype: 'Select',
        options: [
          { label: t`Monthly`, value: 'Monthly' },
          { label: t`Quarterly`, value: 'Quarterly' },
          { label: t`Half Yearly`, value: 'Half Yearly' },
          { label: t`Yearly`, value: 'Yearly' },
        ],
        label: t`Periodicity`,
        fieldname: 'periodicity',
      },
      ,
    ] as Field[];

    let dateFilters = [
      {
        fieldtype: 'Int',
        fieldname: 'fromYear',
        placeholder: t`From Year`,
        label: t`From Year`,
        minvalue: 2000,
        required: true,
      },
      {
        fieldtype: 'Int',
        fieldname: 'toYear',
        placeholder: t`To Year`,
        label: t`To Year`,
        minvalue: 2000,
        required: true,
      },
    ] as Field[];

    if (this.basedOn === 'Until Date') {
      dateFilters = [
        {
          fieldtype: 'Date',
          fieldname: 'toDate',
          placeholder: t`To Date`,
          label: t`To Date`,
          required: true,
        },
        {
          fieldtype: 'Int',
          fieldname: 'count',
          minvalue: 1,
          placeholder: t`Number of ${periodNameMap[this.periodicity]}`,
          label: t`Number of ${periodNameMap[this.periodicity]}`,
          required: true,
        },
      ] as Field[];
    }

    return [
      filters,
      dateFilters,
      {
        fieldtype: 'Check',
        label: t`Consolidate Columns`,
        fieldname: 'consolidateColumns',
      } as Field,
      {
        fieldtype: 'Check',
        label: t`Hide Group Amounts`,
        fieldname: 'hideGroupAmounts',
      } as Field,
    ].flat();
  }

  getColumns(): ColumnField[] {
    const columns = [
      {
        label: t`Account`,
        fieldtype: 'Link',
        fieldname: 'account',
        align: 'left',
        width: ACC_NAME_WIDTH,
      },
    ] as ColumnField[];

    const dateColumns = this._dateRanges!.sort(
      (a, b) => b.toDate.toMillis() - a.toDate.toMillis()
    ).map((d) => {
      const toDate = d.toDate.minus({ days: 1 });
      const label = this.fyo.format(toDate.toJSDate(), 'Date');

      return {
        label,
        fieldtype: 'Data',
        fieldname: 'toDate',
        align: 'right',
        width: ACC_BAL_WIDTH,
      } as ColumnField;
    });

    return [columns, dateColumns].flat();
  }

  metaFilters: string[] = ['basedOn'];
}

export async function getFiscalEndpoints(
  toYear: number,
  fromYear: number,
  fyo: Fyo
) {
  const fys = (await fyo.getValue(
    ModelNameEnum.AccountingSettings,
    'fiscalYearStart'
  )) as Date;
  const fye = (await fyo.getValue(
    ModelNameEnum.AccountingSettings,
    'fiscalYearEnd'
  )) as Date;

  /**
   * Get the month and the day, and
   * prepend with the passed year.
   */

  const fromDate = [
    fromYear,
    fys.toISOString().split('T')[0].split('-').slice(1),
  ]
    .flat()
    .join('-');

  const toDate = [toYear, fye.toISOString().split('T')[0].split('-').slice(1)]
    .flat()
    .join('-');

  return { fromDate, toDate };
}

const monthsMap: Record<Periodicity, number> = {
  Monthly: 1,
  Quarterly: 3,
  'Half Yearly': 6,
  Yearly: 12,
};

function setPruneFlagOnAccountTreeNodes(accountTree: AccountTree) {
  for (const account of Object.values(accountTree)) {
    account.prune = true;
  }
}

function setValueMapOnAccountTreeNodes(
  accountTree: AccountTree,
  rangeGroupedMap: AccountNameValueMapMap
) {
  for (const name of rangeGroupedMap.keys()) {
    if (!accountTree[name]) {
      continue;
    }

    const valueMap = rangeGroupedMap.get(name)!;
    accountTree[name].valueMap = valueMap;
    accountTree[name].prune = false;

    /**
     * Set the update the parent account values recursively
     * also prevent pruning of the parent accounts.
     */
    let parentAccountName: string | null = accountTree[name].parentAccount;

    while (parentAccountName !== null) {
      parentAccountName = updateParentAccountWithChildValues(
        accountTree,
        parentAccountName,
        valueMap
      );
    }
  }
}

function updateParentAccountWithChildValues(
  accountTree: AccountTree,
  parentAccountName: string,
  valueMap: ValueMap
): string {
  const parentAccount = accountTree[parentAccountName];
  parentAccount.prune = false;
  parentAccount.valueMap ??= new Map();

  for (const key of valueMap.keys()) {
    const value = parentAccount.valueMap.get(key);
    const childValue = valueMap.get(key);
    const map: Record<string, number> = {};

    for (const key of Object.keys(childValue!)) {
      map[key] = (value?.[key] ?? 0) + (childValue?.[key] ?? 0);
    }
    parentAccount.valueMap.set(key, map);
  }

  return parentAccount.parentAccount!;
}

function setChildrenOnAccountTreeNodes(accountTree: AccountTree) {
  const parentNodes: Set<string> = new Set();

  for (const name of Object.keys(accountTree)) {
    const ac = accountTree[name];
    if (!ac.parentAccount) {
      continue;
    }

    accountTree[ac.parentAccount].children ??= [];
    accountTree[ac.parentAccount].children!.push(ac);

    parentNodes.add(ac.parentAccount);
  }
}

function deleteNonRootAccountTreeNodes(accountTree: AccountTree) {
  for (const name of Object.keys(accountTree)) {
    const ac = accountTree[name];
    if (!ac.parentAccount) {
      continue;
    }

    delete accountTree[name];
  }
}

function pruneAccountTree(accountTree: AccountTree) {
  for (const root of Object.keys(accountTree)) {
    if (accountTree[root].prune) {
      delete accountTree[root];
    }
  }

  for (const root of Object.keys(accountTree)) {
    accountTree[root].children = getPrunedChildren(
      accountTree[root].children ?? []
    );
  }
}

function getPrunedChildren(children: AccountTreeNode[]): AccountTreeNode[] {
  return children.filter((child) => {
    if (child.children?.length) {
      child.children = getPrunedChildren(child.children);
    }

    return !child.prune;
  });
}

export function convertAccountRootNodeToAccountList(
  rootNode: AccountTreeNode
): AccountList {
  if (!rootNode) {
    return [];
  }

  const accountList: AccountList = [];
  pushToAccountList(rootNode, accountList, 0);
  return accountList;
}

function pushToAccountList(
  accountTreeNode: AccountTreeNode,
  accountList: AccountList,
  level: number
) {
  accountList.push({
    name: accountTreeNode.name,
    rootType: accountTreeNode.rootType,
    isGroup: accountTreeNode.isGroup,
    parentAccount: accountTreeNode.parentAccount,
    valueMap: accountTreeNode.valueMap,
    level,
  });

  const children = accountTreeNode.children ?? [];
  const childLevel = level + 1;

  for (const childNode of children) {
    pushToAccountList(childNode, accountList, childLevel);
  }
}

function getListOfLeafNodes(tree: Tree): TreeNode[] {
  const nonGroupChildren: TreeNode[] = [];
  for (const node of Object.values(tree)) {
    if (!node) {
      continue;
    }

    const groupChildren = node.children ?? [];

    while (groupChildren.length) {
      const child = groupChildren.shift()!;
      if (!child?.children?.length) {
        nonGroupChildren.push(child);
        continue;
      }

      groupChildren.unshift(...(child.children ?? []));
    }
  }

  return nonGroupChildren;
}
