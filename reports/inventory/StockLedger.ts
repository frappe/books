import { Fyo, t } from 'fyo';
import { RawValueMap } from 'fyo/core/types';
import { Action } from 'fyo/model/types';
import { cloneDeep } from 'lodash';
import { DateTime } from 'luxon';
import { InventorySettings } from 'models/inventory/InventorySettings';
import { ValuationMethod } from 'models/inventory/types';
import { ModelNameEnum } from 'models/types';
import getCommonExportActions from 'reports/commonExporter';
import { Report } from 'reports/Report';
import { ColumnField, ReportCell, ReportData, ReportRow } from 'reports/types';
import { Field, RawValue } from 'schemas/types';
import { isNumeric } from 'src/utils';
import { getRawStockLedgerEntries, getStockLedgerEntries } from './helpers';
import { ComputedStockLedgerEntry, ReferenceType } from './types';

export class StockLedger extends Report {
  static title = t`Stock Ledger`;
  static reportName = 'stock-ledger';
  static isInventory = true;

  usePagination: boolean = true;

  _rawData?: ComputedStockLedgerEntry[];
  loading: boolean = false;
  shouldRefresh: boolean = false;

  item?: string;
  location?: string;
  batch?: string;
  serialNumber?: string;
  fromDate?: string;
  toDate?: string;
  ascending?: boolean;
  referenceType?: ReferenceType = 'All';
  referenceName?: string;

  groupBy: 'none' | 'item' | 'location' = 'none';

  get hasBatches(): boolean {
    return !!(this.fyo.singles.InventorySettings as InventorySettings)
      .enableBatches;
  }

  get hasSerialNumbers(): boolean {
    return !!(this.fyo.singles.InventorySettings as InventorySettings)
      .enableSerialNumber;
  }

  constructor(fyo: Fyo) {
    super(fyo);
    this._setObservers();
  }

  async setDefaultFilters() {
    if (!this.toDate) {
      this.toDate = DateTime.now().plus({ days: 1 }).toISODate();
      this.fromDate = DateTime.now().minus({ years: 1 }).toISODate();
    }
  }

  async setReportData(
    filter?: string | undefined,
    force?: boolean | undefined
  ): Promise<void> {
    this.loading = true;
    this.reportData = await this._getReportData(force);
    this.loading = false;
  }

  async _getReportData(force?: boolean): Promise<ReportData> {
    if (this.shouldRefresh || force || !this._rawData?.length) {
      await this._setRawData();
    }

    const rawData = cloneDeep(this._rawData);
    if (!rawData) {
      return [];
    }

    const filtered = this._getFilteredRawData(rawData);
    const grouped = this._getGroupedRawData(filtered);

    return grouped.map((row) =>
      this._convertRawDataRowToReportRow(row as RawValueMap, {
        quantity: null,
        valueChange: null,
      })
    );
  }

  async _setRawData() {
    const valuationMethod =
      (this.fyo.singles.InventorySettings?.valuationMethod as
        | ValuationMethod
        | undefined) ?? ValuationMethod.FIFO;

    const rawSLEs = await getRawStockLedgerEntries(this.fyo);
    this._rawData = getStockLedgerEntries(rawSLEs, valuationMethod);
  }

  _getFilteredRawData(rawData: ComputedStockLedgerEntry[]) {
    const filteredRawData: ComputedStockLedgerEntry[] = [];
    if (!rawData.length) {
      return [];
    }

    const fromDate = this.fromDate ? Date.parse(this.fromDate) : null;
    const toDate = this.toDate ? Date.parse(this.toDate) : null;

    if (!this.ascending) {
      rawData.reverse();
    }

    let i = 0;
    for (const idx in rawData) {
      const row = rawData[idx];
      if (this.item && row.item !== this.item) {
        continue;
      }

      if (this.location && row.location !== this.location) {
        continue;
      }

      if (this.batch && row.batch !== this.batch) {
        continue;
      }

      const date = row.date.valueOf();
      if (toDate && date > toDate) {
        continue;
      }

      if (fromDate && date < fromDate) {
        continue;
      }

      if (
        this.referenceType !== 'All' &&
        row.referenceType !== this.referenceType
      ) {
        continue;
      }

      if (this.referenceName && row.referenceName !== this.referenceName) {
        continue;
      }

      row.name = ++i;
      filteredRawData.push(row);
    }

    return filteredRawData;
  }

  _getGroupedRawData(rawData: ComputedStockLedgerEntry[]) {
    const groupBy = this.groupBy;
    if (groupBy === 'none') {
      return rawData;
    }

    const groups: Map<string, ComputedStockLedgerEntry[]> = new Map();
    for (const row of rawData) {
      const key = row[groupBy];
      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)?.push(row);
    }

    const groupedRawData: (ComputedStockLedgerEntry | { name: null })[] = [];
    let i = 0;
    for (const key of groups.keys()) {
      for (const row of groups.get(key) ?? []) {
        row.name = ++i;
        groupedRawData.push(row);
      }

      groupedRawData.push({ name: null });
    }

    if (groupedRawData.at(-1)?.name === null) {
      groupedRawData.pop();
    }

    return groupedRawData;
  }

  _convertRawDataRowToReportRow(
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

  _setObservers() {
    const listener = () => (this.shouldRefresh = true);

    this.fyo.doc.observer.on(
      `sync:${ModelNameEnum.StockLedgerEntry}`,
      listener
    );

    this.fyo.doc.observer.on(
      `delete:${ModelNameEnum.StockLedgerEntry}`,
      listener
    );
  }

  getColumns(): ColumnField[] {
    const batch: Field[] = [];
    const serialNumber: Field[] = [];

    if (this.hasBatches) {
      batch.push({
        fieldname: 'batch',
        label: 'Batch',
        fieldtype: 'Link',
        target: 'Batch',
      });
    }

    if (this.hasSerialNumbers) {
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
        fieldname: 'date',
        label: 'Date',
        fieldtype: 'Datetime',
        width: 1.25,
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
        fieldname: 'quantity',
        label: 'Quantity',
        fieldtype: 'Float',
      },
      {
        fieldname: 'balanceQuantity',
        label: 'Balance Qty.',
        fieldtype: 'Float',
      },
      {
        fieldname: 'incomingRate',
        label: 'Incoming rate',
        fieldtype: 'Currency',
      },
      {
        fieldname: 'valuationRate',
        label: 'Valuation Rate',
        fieldtype: 'Currency',
      },
      {
        fieldname: 'balanceValue',
        label: 'Balance Value',
        fieldtype: 'Currency',
      },
      {
        fieldname: 'valueChange',
        label: 'Value Change',
        fieldtype: 'Currency',
      },
      {
        fieldname: 'referenceName',
        label: 'Ref. Name',
        fieldtype: 'DynamicLink',
      },
      {
        fieldname: 'referenceType',
        label: 'Ref. Type',
        fieldtype: 'Data',
      },
    ];
  }

  getFilters(): Field[] {
    return [
      {
        fieldtype: 'Select',
        options: [
          { label: t`All`, value: 'All' },
          { label: t`Stock Movements`, value: 'StockMovement' },
          { label: t`Shipment`, value: 'Shipment' },
          { label: t`Purchase Receipt`, value: 'PurchaseReceipt' },
        ],
        label: t`Ref Type`,
        fieldname: 'referenceType',
        placeholder: t`Ref Type`,
      },
      {
        fieldtype: 'DynamicLink',
        label: t`Ref Name`,
        references: 'referenceType',
        placeholder: t`Ref Name`,
        emptyMessage: t`Change Ref Type`,
        fieldname: 'referenceName',
      },
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
        ? ([
            {
              fieldtype: 'Link',
              target: 'Batch',
              placeholder: t`Batch`,
              label: t`Batch`,
              fieldname: 'batch',
            },
          ] as Field[])
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
        fieldtype: 'Select',
        label: t`Group By`,
        fieldname: 'groupBy',
        options: [
          { label: t`None`, value: 'none' },
          { label: t`Item`, value: 'item' },
          { label: t`Location`, value: 'location' },
          { label: t`Reference`, value: 'referenceName' },
        ],
      },
      {
        fieldtype: 'Check',
        label: t`Ascending Order`,
        fieldname: 'ascending',
      },
    ] as Field[];
  }

  getActions(): Action[] {
    return getCommonExportActions(this);
  }
}
