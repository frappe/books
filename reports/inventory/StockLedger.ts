import { t } from 'fyo';
import { RawValueMap } from 'fyo/core/types';
import { Action } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';
import getCommonExportActions from 'reports/commonExporter';
import { Report } from 'reports/Report';
import { ColumnField, ReportCell, ReportData, ReportRow } from 'reports/types';
import { Field, RawValue } from 'schemas/types';
import { isNumeric } from 'src/utils';

export class StockLedger extends Report {
  static title = t`Stock Ledger`;
  static reportName = 'stock-ledger';

  loading: boolean = false;
  async setReportData(
    filter?: string | undefined,
    force?: boolean | undefined
  ): Promise<void> {
    this.loading = true;
    this.reportData = await this._getReportData();
    this.loading = false;
  }

  async _getReportData(): Promise<ReportData> {
    const columns = this.getColumns();
    const fieldnames = columns.map(({ fieldname }) => fieldname);
    const rawData = await this.fyo.db.getAllRaw(
      ModelNameEnum.StockLedgerEntry,
      {
        fields: fieldnames,
      }
    );

    return this.convertRawDataToReportData(rawData, columns);
  }

  convertRawDataToReportData(
    rawData: RawValueMap[],
    fields: Field[]
  ): ReportData {
    const reportData: ReportData = [];
    for (const row of rawData) {
      reportData.push(this.convertRawDataRowToReportRow(row, fields));
    }
    return reportData;
  }

  convertRawDataRowToReportRow(row: RawValueMap, fields: Field[]): ReportRow {
    const cells: ReportCell[] = [];
    for (const { fieldname, fieldtype } of fields) {
      const rawValue = row[fieldname] as RawValue;
      const value = this.fyo.format(rawValue, fieldtype);
      const align = isNumeric(fieldtype) ? 'right' : 'left';

      cells.push({ rawValue, value, align });
    }

    return { cells };
  }

  getColumns(): ColumnField[] {
    return (
      this.fyo.schemaMap[ModelNameEnum.StockLedgerEntry]?.fields ?? []
    ).filter((f) => !f.meta);
  }

  getFilters(): Field[] | Promise<Field[]> {
    return [];
  }

  getActions(): Action[] {
    return getCommonExportActions(this);
  }
}
