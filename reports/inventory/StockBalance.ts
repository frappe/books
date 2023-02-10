import { t } from 'fyo';
import { RawValueMap } from 'fyo/core/types';
import { Action } from 'fyo/model/types';
import getCommonExportActions from 'reports/commonExporter';
import { ColumnField, ReportData } from 'reports/types';
import { Field } from 'schemas/types';
import {
  getBatchWiseStockBalanceEntries,
  getStockBalanceEntries,
} from './helpers';
import { StockLedger } from './StockLedger';
import { ReferenceType } from './types';

export class StockBalance extends StockLedger {
  static title = t`Stock Balance`;
  static reportName = 'stock-balance';
  static isInventory = true;

  showBatchWiseItem?: Boolean = false;
  batchNumber?: string;

  override ascending: boolean = true;
  override referenceType: ReferenceType = 'All';
  override referenceName: string = '';

  override async _getReportData(force?: boolean): Promise<ReportData> {
    let rawData;
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

    if (this.showBatchWiseItem) {
      rawData = await getBatchWiseStockBalanceEntries(
        (await this.fyo.db.getBatchWiseStockBalance()) ?? [],
        filters
      );
    } else {
      rawData = getStockBalanceEntries(this._rawData ?? [], filters);
    }

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
        fieldtype: 'Link',
        target: 'BatchNumber',
        placeholder: t`Batch Number`,
        label: t`Batch Number`,
        fieldname: 'batchNumber',
      },
      {
        fieldtype: 'Check',
        label: t`Show Batch-Wise Item`,
        fieldname: 'showBatchWiseItem',
      },
    ] as Field[];
  }

  getColumns(): ColumnField[] {
    let columns = [
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
        fieldname: 'balanceQuantity',
        label: 'Balance Qty.',
        fieldtype: 'Float',
      },
      {
        fieldname: 'balanceValue',
        label: 'Balance Value',
        fieldtype: 'Float',
      },
      {
        fieldname: 'openingQuantity',
        label: 'Opening Qty.',
        fieldtype: 'Float',
      },
      {
        fieldname: 'openingValue',
        label: 'Opening Value',
        fieldtype: 'Float',
      },
      {
        fieldname: 'incomingQuantity',
        label: 'In Qty.',
        fieldtype: 'Float',
      },
      {
        fieldname: 'incomingValue',
        label: 'In Value',
        fieldtype: 'Currency',
      },
      {
        fieldname: 'outgoingQuantity',
        label: 'Out Qty.',
        fieldtype: 'Float',
      },
      {
        fieldname: 'outgoingValue',
        label: 'Out Value',
        fieldtype: 'Currency',
      },
      {
        fieldname: 'valuationRate',
        label: 'Valuation rate',
        fieldtype: 'Currency',
      },
    ] as ColumnField[];

    if (!this.showBatchWiseItem) {
      columns = columns.filter((f) => f.fieldname !== 'batchNumber');
    } else if (this.showBatchWiseItem) {
      columns = columns.filter(
        (f) =>
          ![
            'valuationRate',
            'balanceValue',
            'openingValue',
            'incomingValue',
            'outgoingValue',
          ].includes(f.fieldname)
      );
    }
    return columns;
  }

  getActions(): Action[] {
    return getCommonExportActions(this);
  }
}
