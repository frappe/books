import { t } from 'fyo';
import { DateTime } from 'luxon';
import {
  AccountRootType,
  AccountRootTypeEnum,
} from 'models/baseModels/Account/types';
import {
  AccountReport,
  ACC_BAL_WIDTH,
  ACC_NAME_WIDTH,
  convertAccountRootNodesToAccountList,
} from 'reports/AccountReport';
import {
  AccountListNode,
  ColumnField,
  DateRange,
  ReportCell,
  ReportData,
  ReportRow,
  RootTypeRow,
} from 'reports/types';
import { Field } from 'schemas/types';
import { getMapFromList } from 'utils';
import { QueryFilter } from 'utils/db/types';

export class BalanceSheet extends AccountReport {
  static title = t`Balance Sheet`;
  static reportName = 'balance-sheet';
  loading = false;

  get rootTypes(): AccountRootType[] {
    return [
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

    for (const name of Object.keys(accountTree)) {
      const { rootType } = accountTree[name];
      if (this.rootTypes.includes(rootType)) {
        continue;
      }

      delete accountTree[name];
    }

    const rootTypeRows: RootTypeRow[] = this.rootTypes
      .map((rootType) => {
        const rootNodes = this.getRootNodes(rootType, accountTree)!;
        const rootList = convertAccountRootNodesToAccountList(rootNodes);
        return {
          rootType,
          rootNodes,
          rows: this.getReportRowsFromAccountList(rootList),
        };
      })
      .filter((row) => !!row.rootNodes.length);

    this.reportData = this.getReportDataFromRows(
      getMapFromList(rootTypeRows, 'rootType')
    );
    this.loading = false;
  }

  getReportDataFromRows(
    rootTypeRows: Record<AccountRootType, RootTypeRow | undefined>
  ): ReportData {
    const typeNameList = [
      {
        rootType: AccountRootTypeEnum.Asset,
        totalName: t`Total Asset (Debit)`,
      },
      {
        rootType: AccountRootTypeEnum.Liability,
        totalName: t`Total Liability (Credit)`,
      },
      {
        rootType: AccountRootTypeEnum.Equity,
        totalName: t`Total Equity (Credit)`,
      },
    ];

    const reportData: ReportData = [];
    const emptyRow = this.getEmptyRow();
    for (const { rootType, totalName } of typeNameList) {
      const row = rootTypeRows[rootType];
      if (!row) {
        continue;
      }

      reportData.push(...row.rows);

      if (row.rootNodes.length) {
        const totalNode = this.getTotalNode(row.rootNodes, totalName);
        const totalRow = this.getRowFromAccountListNode(totalNode);
        reportData.push(totalRow);
      }

      reportData.push(emptyRow);
    }

    if (reportData.at(-1)?.isEmpty) {
      reportData.pop();
    }

    return reportData;
  }

  async _getQueryFilters(): Promise<QueryFilter> {
    const filters: QueryFilter = {};
    const toDate = DateTime.fromISO(this.toDate!).plus({ days: 1 }).toISODate();

    filters.date = ['<', toDate];
    filters.reverted = false;

    if (this.project) {
      filters.project = this.project;
    }
    return filters;
  }

  async _getDateRanges(): Promise<DateRange[]> {
    return [
      {
        fromDate: DateTime.fromISO('0001-01-01'),
        toDate: DateTime.fromISO(this.toDate!).plus({ days: 1 }),
      },
    ];
  }

  getFilters(): Field[] {
    const filters: Field[] = [
      {
        fieldtype: 'Date',
        fieldname: 'toDate',
        placeholder: t`As on Date`,
        label: t`As on Date`,
        required: true,
      },
      {
        fieldtype: 'Check',
        label: t`Hide Group Amounts`,
        fieldname: 'hideGroupAmounts',
      } as Field,
    ];

    if (this.fyo.singles.AccountingSettings?.enableProjects) {
      filters.splice(1, 0, {
        fieldtype: 'Link',
        target: 'Project',
        label: t`Project`,
        placeholder: t`Project`,
        fieldname: 'project',
      } as Field);
    }
    return filters;
  }

  getColumns(): ColumnField[] {
    return [
      {
        label: t`Account`,
        fieldtype: 'Link',
        fieldname: 'account',
        align: 'left',
        width: ACC_NAME_WIDTH,
      },
      {
        label: t`Amount`,
        fieldtype: 'Data',
        fieldname: 'amount',
        align: 'right',
        width: ACC_BAL_WIDTH,
      },
    ] as ColumnField[];
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

    const [dateRange] = this._dateRanges!;
    const rawValue = al.valueMap?.get(dateRange)?.balance ?? 0;
    let value = this.fyo.format(rawValue, 'Currency');
    if (this.hideGroupAmounts && al.isGroup) {
      value = '';
    }

    const balanceCell = {
      rawValue,
      value,
      align: 'right',
      width: ACC_BAL_WIDTH,
    } as ReportCell;

    return {
      cells: [nameCell, balanceCell],
      level: al.level,
      isGroup: !!al.isGroup,
      folded: false,
      foldedBelow: false,
    } as ReportRow;
  }
}
