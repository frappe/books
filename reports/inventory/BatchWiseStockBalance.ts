import { t } from 'fyo';
import { RawValueMap } from 'fyo/core/types';
import { Action } from 'fyo/model/types';
import getCommonExportActions from 'reports/commonExporter';
import { ColumnField, ReportCell, ReportData, ReportRow } from 'reports/types';
import { Field, RawValue } from 'schemas/types';
import { isNumeric } from 'src/utils';
import { getBatchWiseStockBalanceEntries } from './helpers';
import { StockLedger } from './StockLedger';
import { ComputedStockLedgerEntry, ReferenceType } from './types';

export class BatchWiseStockBalance extends StockLedger {
  static title = t`Stock Balance`;
  static reportName = 'stock-balance';
  static isInventory = true;

  override ascending: boolean = true;
  override referenceType: ReferenceType = 'All';
  override referenceName: string = '';

  override async _getReportData(force?: boolean): Promise<ReportData> {
    if (this.shouldRefresh || force || !this._rawData?.length) {
      await this._setRawData();
    }
    const filters = {
      item: this.item,
      location: this.location,
      fromDate: this.fromDate,
      toDate: this.toDate,
      batchNumber: this.batchNumber,
    };

    this._rawData = await this.fyo.db.getBatchWiseStockBalance();

    const rawData = getBatchWiseStockBalanceEntries(
      this._rawData ?? [],
      filters
    );

    return rawData.map((sbe, i) => {
      const row = { ...sbe, name: i + 1 } as RawValueMap;

      return this._convertRawDataRowToReportRow(row, {
        incomingQuantity: 'green',
        outgoingQuantity: 'red',
        balanceQuantity: null,
      });
    });
  }

  getFilters(): Field[] {
    return [
      {
        fieldtype: 'Link',
        target: 'Item',
        placeholder: t`Item`,
        label: t`Item`,
        fieldname: 'item',
      },
      {
        fieldtype: 'Link',
        target: 'Location',
        placeholder: t`Location`,
        label: t`Location`,
        fieldname: 'location',
      },
      {
        fieldtype: 'Date',
        placeholder: t`From Date`,
        label: t`From Date`,
        fieldname: 'fromDate',
      },
      {
        fieldtype: 'Date',
        placeholder: t`To Date`,
        label: t`To Date`,
        fieldname: 'toDate',
      },
      {
        fieldname: 'batchNumber',
        target: 'BatchNumber',
        placeholder: t`Batch Number`,
        label: 'Batch Number',
        fieldtype: 'Link',
      },
    ] as Field[];
  }

  getColumns(): ColumnField[] {
    return [
      {
        fieldname: 'name',
        label: '#',
        fieldtype: 'Int',
        width: 0.5,
      },
      {
        fieldname: 'item',
        label: 'Item',
        fieldtype: 'Link',
      },
      {
        fieldname: 'location',
        label: 'Location',
        fieldtype: 'Link',
      },
      {
        fieldname: 'batchNumber',
        label: 'Batch Number',
        fieldtype: 'Link',
      },
      {
        fieldname: 'openingQuantity',
        label: 'Opening Qty.',
        fieldtype: 'Float',
      },
      {
        fieldname: 'balanceQuantity',
        label: 'Balance Quantity',
        fieldtype: 'Data',
      },
      {
        fieldname: 'incomingQuantity',
        label: 'In Qty.',
        fieldtype: 'Float',
      },
      {
        fieldname: 'outgoingQuantity',
        label: 'Out Qty.',
        fieldtype: 'Float',
      },
    ];
  }

  getActions(): Action[] {
    return getCommonExportActions(this);
  }

  override _convertRawDataRowToReportRow(
    row: RawValueMap,
    colouredMap: Record<string, 'red' | 'green' | null>
  ): ReportRow {
    const cells: ReportCell[] = [];
    const columns = this.getColumns();

    if (row.name === null) {
      return {
        isEmpty: true,
        cells: columns.map((c) => ({
          rawValue: '',
          value: '',
          width: c.width ?? 1,
        })),
      };
    }

    for (const col of columns) {
      const fieldname = col.fieldname as keyof ComputedStockLedgerEntry;
      const fieldtype = col.fieldtype;
      const rawValue = row[fieldname] as RawValue;

      let value;
      if (col.fieldname === 'referenceType' && typeof rawValue === 'string') {
        value = this.fyo.schemaMap[rawValue]?.label ?? rawValue;
      } else {
        value = this.fyo.format(rawValue, fieldtype);
      }

      const align = isNumeric(fieldtype) ? 'right' : 'left';

      const isColoured = fieldname in colouredMap;
      const isNumber = typeof rawValue === 'number';
      let color: 'red' | 'green' | undefined = undefined;

      if (isColoured && colouredMap[fieldname]) {
        color = colouredMap[fieldname]!;
      } else if (isColoured && isNumber && rawValue > 0) {
        color = 'green';
      } else if (isColoured && isNumber && rawValue < 0) {
        color = 'red';
      }

      cells.push({ rawValue, value, align, color, width: col.width });
    }

    return { cells };
  }
}
