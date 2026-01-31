import { t } from 'fyo';
import { RawValueMap } from 'fyo/core/types';
import { Action } from 'fyo/model/types';
import getCommonExportActions from 'reports/commonExporter';
import { ColumnField, ReportData } from 'reports/types';
import { Field } from 'schemas/types';
import { getStockBalanceEntries } from './helpers';
import { StockLedger } from './StockLedger';
import { ReferenceType, SerialNumberStatus } from './types';

export class StockBalance extends StockLedger {
  static title = t`Stock Balance`;
  static reportName = 'stock-balance';
  static isInventory = true;

  override ascending = true;
  override referenceType: ReferenceType = 'All';
  override referenceName = '';

  showSerialNumbers = false;
  serialNumberFilter: SerialNumberStatus = 'All';

  override async _getReportData(force?: boolean): Promise<ReportData> {
    if (this.shouldRefresh || force || !this._rawData?.length) {
      await this._setRawData();
    }

    const filters = {
      item: this.item,
      location: this.location,
      batch: this.batch,
      fromDate: this.fromDate,
      toDate: this.toDate,
    };

    const rawData = getStockBalanceEntries(
      this._rawData ?? [],
      filters,
      this.showSerialNumbers,
      this.serialNumberFilter
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
    const filters = [
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
      ...(this.hasBatches
        ? [
            {
              fieldtype: 'Link',
              target: 'Batch',
              placeholder: t`Batch`,
              label: t`Batch`,
              fieldname: 'batch',
            },
          ]
        : []),
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
        fieldtype: 'Check',
        placeholder: t`Serial Number`,
        label: t`Serial Number`,
        fieldname: 'showSerialNumbers',
      },
      ...(this.showSerialNumbers
        ? ([
            {
              fieldtype: 'Select',
              options: [
                { label: t`All`, value: 'All' },
                { label: t`In stock`, value: 'In stock' },
                { label: t`Out stock`, value: 'Out stock' },
              ],
              placeholder: t`Serial Number Status`,
              label: t`Serial Number Status`,
              fieldname: 'serialNumberFilter',
              default: 'All',
            },
          ] as Field[])
        : []),
    ] as Field[];

    return filters;
  }

  getColumns(): ColumnField[] {
    const batch: ColumnField[] = [];
    const serialNumber: ColumnField[] = [];

    if (this.hasBatches) {
      batch.push({
        fieldname: 'batch',
        label: 'Batch',
        fieldtype: 'Link',
      });
    }

    if (this.showSerialNumbers && this.hasSerialNumbers) {
      serialNumber.push({
        fieldname: 'serialNumber',
        label: 'Serial Number',
        fieldtype: 'Data',
      });
    }

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
      ...batch,
      ...serialNumber,
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
    ];
  }

  getActions(): Action[] {
    return getCommonExportActions(this);
  }
}
