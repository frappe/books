import { Fyo, t } from 'fyo';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import { LedgerReport } from 'reports/LedgerReport';
import {
  ColumnField,
  GroupedMap,
  LedgerEntry,
  ReportData,
  ReportRow,
} from 'reports/types';
import { Field, FieldTypeEnum } from 'schemas/types';
import { QueryFilter } from 'utils/db/types';

type ReferenceType =
  | ModelNameEnum.SalesInvoice
  | ModelNameEnum.PurchaseInvoice
  | ModelNameEnum.Payment
  | ModelNameEnum.JournalEntry
  | ModelNameEnum.Shipment
  | ModelNameEnum.PurchaseReceipt
  | 'All';

export class GeneralLedger extends LedgerReport {
  static title = t`General Ledger`;
  static reportName = 'general-ledger';
  usePagination: boolean = true;
  loading: boolean = false;

  ascending: boolean = false;
  reverted: boolean = false;
  referenceType: ReferenceType = 'All';
  groupBy: 'none' | 'party' | 'account' | 'referenceName' = 'none';
  _rawData: LedgerEntry[] = [];

  constructor(fyo: Fyo) {
    super(fyo);
  }

  async setDefaultFilters() {
    if (!this.toDate) {
      this.toDate = DateTime.now().plus({ days: 1 }).toISODate();
      this.fromDate = DateTime.now().minus({ years: 1 }).toISODate();
    }
  }

  async setReportData(filter?: string, force?: boolean) {
    this.loading = true;
    let sort = true;
    if (force || filter !== 'grouped' || this._rawData.length === 0) {
      await this._setRawData();
      sort = false;
    }

    const map = this._getGroupedMap(sort);
    this._setIndexOnEntries(map);
    const { totalDebit, totalCredit } = this._getTotalsAndSetBalance(map);
    const consolidated = this._consolidateEntries(map);

    /**
     * Push a blank row if last row isn't blank
     */
    if (consolidated.at(-1)?.name !== -3) {
      this._pushBlankEntry(consolidated);
    }

    /**
     * Set the closing row
     */
    consolidated.push({
      name: -2, // Bold
      account: t`Closing`,
      date: null,
      debit: totalDebit,
      credit: totalCredit,
      balance: totalDebit - totalCredit,
      referenceType: '',
      referenceName: '',
      party: '',
      reverted: false,
      reverts: '',
    });

    this.reportData = this._convertEntriesToReportData(consolidated);
    this.loading = false;
  }

  _setIndexOnEntries(map: GroupedMap) {
    let i = 1;
    for (const key of map.keys()) {
      for (const entry of map.get(key)!) {
        entry.index = String(i);
        i = i + 1;
      }
    }
  }

  _convertEntriesToReportData(entries: LedgerEntry[]): ReportData {
    const reportData = [];
    for (const entry of entries) {
      const row = this._getRowFromEntry(entry, this.columns);
      reportData.push(row);
    }

    return reportData;
  }

  _getRowFromEntry(entry: LedgerEntry, columns: ColumnField[]): ReportRow {
    if (entry.name === -3) {
      return {
        isEmpty: true,
        cells: columns.map((c) => ({
          rawValue: '',
          value: '',
          width: c.width ?? 1,
        })),
      };
    }

    const row: ReportRow = { cells: [] };
    for (const col of columns) {
      const align = col.align ?? 'left';
      const width = col.width ?? 1;
      const fieldname = col.fieldname;

      let value = entry[fieldname as keyof LedgerEntry];
      const rawValue = value;
      if (value === null || value === undefined) {
        value = '';
      }

      if (value instanceof Date) {
        value = this.fyo.format(value, FieldTypeEnum.Date);
      }

      if (typeof value === 'number' && fieldname !== 'index') {
        value = this.fyo.format(value, FieldTypeEnum.Currency);
      }

      if (typeof value === 'boolean' && fieldname === 'reverted') {
        value = value ? t`Reverted` : '';
      } else {
        value = String(value);
      }

      if (fieldname === 'referenceType') {
        value = this.fyo.schemaMap[value]?.label ?? value;
      }

      row.cells.push({
        italics: entry.name === -1,
        bold: entry.name === -2,
        value,
        rawValue,
        align,
        width,
      });
    }

    return row;
  }

  _consolidateEntries(map: GroupedMap) {
    const entries: LedgerEntry[] = [];
    for (const key of map.keys()) {
      entries.push(...map.get(key)!);

      /**
       * Add blank row for spacing if groupBy
       */
      if (this.groupBy !== 'none') {
        this._pushBlankEntry(entries);
      }
    }

    return entries;
  }

  _pushBlankEntry(entries: LedgerEntry[]) {
    entries.push({
      name: -3, // Empty
      account: '',
      date: null,
      debit: null,
      credit: null,
      balance: null,
      referenceType: '',
      referenceName: '',
      party: '',
      reverted: false,
      reverts: '',
    });
  }

  _getTotalsAndSetBalance(map: GroupedMap) {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const key of map.keys()) {
      let balance = 0;
      let debit = 0;
      let credit = 0;

      for (const entry of map.get(key)!) {
        debit += entry.debit!;
        credit += entry.credit!;

        const diff = entry.debit! - entry.credit!;
        balance += diff;
        entry.balance = balance;
      }

      /**
       * Total row incase groupBy is used
       */
      if (this.groupBy !== 'none') {
        map.get(key)?.push({
          name: -1, // Italics
          account: t`Total`,
          date: null,
          debit,
          credit,
          balance: debit - credit,
          referenceType: '',
          referenceName: '',
          party: '',
          reverted: false,
          reverts: '',
        });
      }

      /**
       * Total debit and credit for the final row
       */
      totalDebit += debit;
      totalCredit += credit;
    }

    return { totalDebit, totalCredit };
  }

  async _getQueryFilters(): Promise<QueryFilter> {
    const filters: QueryFilter = {};
    const stringFilters = ['account', 'party', 'referenceName'];

    for (const sf of stringFilters) {
      const value = this[sf];
      if (value === undefined) {
        continue;
      }

      filters[sf] = value as string;
    }

    if (this.referenceType !== 'All') {
      filters.referenceType = this.referenceType as string;
    }

    if (this.toDate) {
      filters.date ??= [];
      (filters.date as string[]).push('<=', this.toDate as string);
    }

    if (this.fromDate) {
      filters.date ??= [];
      (filters.date as string[]).push('>=', this.fromDate as string);
    }

    if (!this.reverted) {
      filters.reverted = false;
    }

    return filters;
  }

  getFilters() {
    const refTypeOptions = [
      { label: t`All`, value: 'All' },
      { label: t`Sales Invoices`, value: 'SalesInvoice' },
      { label: t`Purchase Invoices`, value: 'PurchaseInvoice' },
      { label: t`Payments`, value: 'Payment' },
      { label: t`Journal Entries`, value: 'JournalEntry' },
    ];

    if (!this.fyo.singles.AccountingSettings?.enableInventory) {
      refTypeOptions.push(
        { label: t`Shipment`, value: 'Shipment' },
        { label: t`Purchase Receipt`, value: 'PurchaseReceipt' }
      );
    }

    return [
      {
        fieldtype: 'Select',
        options: refTypeOptions,
        label: t`Ref Type`,
        fieldname: 'referenceType',
        placeholder: t`Ref Type`,
      },
      {
        fieldtype: 'DynamicLink',
        label: t`Ref. Name`,
        references: 'referenceType',
        placeholder: t`Ref Name`,
        emptyMessage: t`Change Ref Type`,
        fieldname: 'referenceName',
      },
      {
        fieldtype: 'Link',
        target: 'Account',
        placeholder: t`Account`,
        label: t`Account`,
        fieldname: 'account',
      },
      {
        fieldtype: 'Link',
        target: 'Party',
        label: t`Party`,
        placeholder: t`Party`,
        fieldname: 'party',
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
        fieldtype: 'Select',
        label: t`Group By`,
        fieldname: 'groupBy',
        options: [
          { label: t`None`, value: 'none' },
          { label: t`Party`, value: 'party' },
          { label: t`Account`, value: 'account' },
          { label: t`Reference`, value: 'referenceName' },
        ],
      },
      {
        fieldtype: 'Check',
        label: t`Include Cancelled`,
        fieldname: 'reverted',
      },
      {
        fieldtype: 'Check',
        label: t`Ascending Order`,
        fieldname: 'ascending',
      },
    ] as Field[];
  }

  getColumns(): ColumnField[] {
    let columns = [
      {
        label: '#',
        fieldtype: 'Int',
        fieldname: 'index',
        align: 'right',
        width: 0.5,
      },
      {
        label: t`Account`,
        fieldtype: 'Link',
        fieldname: 'account',
        width: 1.5,
      },
      {
        label: t`Date`,
        fieldtype: 'Date',
        fieldname: 'date',
      },
      {
        label: t`Debit`,
        fieldtype: 'Currency',
        fieldname: 'debit',
        align: 'right',
        width: 1.25,
      },
      {
        label: t`Credit`,
        fieldtype: 'Currency',
        fieldname: 'credit',
        align: 'right',
        width: 1.25,
      },
      {
        label: t`Balance`,
        fieldtype: 'Currency',
        fieldname: 'balance',
        align: 'right',
        width: 1.25,
      },
      {
        label: t`Party`,
        fieldtype: 'Link',
        fieldname: 'party',
      },
      {
        label: t`Ref Name`,
        fieldtype: 'Data',
        fieldname: 'referenceName',
      },
      {
        label: t`Ref Type`,
        fieldtype: 'Data',
        fieldname: 'referenceType',
      },
      {
        label: t`Reverted`,
        fieldtype: 'Check',
        fieldname: 'reverted',
      },
    ] as ColumnField[];

    if (!this.reverted) {
      columns = columns.filter((f) => f.fieldname !== 'reverted');
    }

    return columns;
  }
}
