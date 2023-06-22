import { t } from 'fyo';
import {
  AccountRootType,
  AccountRootTypeEnum,
} from 'models/baseModels/Account/types';
import {
  AccountReport,
  convertAccountRootNodeToAccountList,
} from 'reports/AccountReport';
import { ReportData, RootTypeRow } from 'reports/types';
import { getMapFromList } from 'utils';

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
        const rootNode = this.getRootNode(rootType, accountTree)!;
        const rootList = convertAccountRootNodeToAccountList(rootNode);
        return {
          rootType,
          rootNode,
          rows: this.getReportRowsFromAccountList(rootList),
        };
      })
      .filter((row) => !!row.rootNode);

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

      if (row.rootNode) {
        const totalNode = this.getTotalNode(row.rootNode, totalName);
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
}
