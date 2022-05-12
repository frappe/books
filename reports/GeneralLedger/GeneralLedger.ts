import { Fyo, t } from 'fyo';
import { Action } from 'fyo/model/types';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import { Report } from 'reports/Report';
import { ColumnField, ReportData } from 'reports/types';
import { Field, FieldTypeEnum, RawValue } from 'schemas/types';
import { QueryFilter } from 'utils/db/types';

interface RawLedgerEntry {
  name: string;
  account: string;
  date: string;
  debit: string;
  credit: string;
  referenceType: string;
  referenceName: string;
  party: string;
  reverted: number;
  reverts: string;
  [key: string]: RawValue;
}

interface LedgerEntry {
  name: number;
  account: string;
  date: Date | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  referenceType: string;
  referenceName: string;
  party: string;
  reverted: boolean;
  reverts: string;
}

type GroupedMap = Map<string, LedgerEntry[]>;

export class GeneralLedger extends Report {
  static title = t`General Ledger`;
  static reportName = 'general-ledger';

  ascending!: boolean;
  groupBy!: 'none' | 'party' | 'account' | 'referenceName';
  _rawData: LedgerEntry[] = [];

  constructor(fyo: Fyo) {
    super(fyo);

    if (!this.toField) {
      this.toField = DateTime.now().toISODate();
      this.fromField = DateTime.now().minus({ years: 1 }).toISODate();
    }
  }

  async setReportData(filter?: string) {
    if (filter !== 'grouped' || this._rawData.length === 0) {
      await this._setRawData();
    }

    const map = this._getGroupedMap();
    const { totalDebit, totalCredit } = this._getTotalsAndSetBalance(map);
    const consolidated = this._consolidateEntries(map);

    /**
     * Push a blank row if last row isn't blank
     */
    if (consolidated.at(-1)!.name !== -3) {
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
  }

  _convertEntriesToReportData(entries: LedgerEntry[]): ReportData {
    const reportData = [];
    const fieldnames = this.columns.map((f) => f.fieldname);
    for (const entry of entries) {
      const row = this._getRowFromEntry(entry, fieldnames);
      reportData.push(row);
    }

    return reportData;
  }

  _getRowFromEntry(entry: LedgerEntry, fieldnames: string[]) {
    if (entry.name === -3) {
      return Array(fieldnames.length).fill({ value: '' });
    }

    const row = [];
    for (const n of fieldnames) {
      let value = entry[n as keyof LedgerEntry];
      if (value === null || value === undefined) {
        row.push({ value: '' });
        continue;
      }

      let align = 'left';
      if (value instanceof Date) {
        value = this.fyo.format(value, FieldTypeEnum.Date);
      }

      if (typeof value === 'number') {
        align = 'right';
        value = this.fyo.format(value, FieldTypeEnum.Currency);
      }

      if (typeof value === 'boolean' && n === 'reverted' && value) {
        value = t`Reverted`;
      }

      row.push({
        italics: entry.name === -1,
        bold: entry.name === -2,
        value,
        align,
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

  _getGroupedMap(): GroupedMap {
    let groupBy: keyof LedgerEntry = 'referenceName';
    if (this.groupBy !== 'none') {
      groupBy = this.groupBy;
    }

    /**
     * Sort rows by ascending or descending
     */
    this._rawData.sort((a, b) => {
      if (this.ascending) {
        return a.name - b.name;
      }

      return b.name - a.name;
    });

    /**
     * Map remembers the order of insertion
     * ∴ presorting maintains grouping order
     */
    const map: GroupedMap = new Map();
    for (const entry of this._rawData) {
      const groupingKey = entry[groupBy];
      if (!map.has(groupingKey)) {
        map.set(groupingKey, []);
      }

      map.get(groupingKey)!.push(entry);
    }

    return map;
  }

  async _setRawData() {
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

    const filters = this._getQueryFilters();
    const entries = (await this.fyo.db.getAllRaw(
      ModelNameEnum.AccountingLedgerEntry,
      {
        fields,
        filters,
      }
    )) as RawLedgerEntry[];

    this._rawData = entries.map((entry) => {
      return {
        name: parseInt(entry.name),
        account: entry.account,
        date: new Date(entry.date),
        debit: parseFloat(entry.debit),
        credit: parseFloat(entry.credit),
        balance: 0,
        referenceType: entry.referenceType,
        referenceName: entry.referenceName,
        party: entry.party,
        reverted: Boolean(entry.reverted),
        reverts: entry.reverts,
      } as LedgerEntry;
    });
  }

  _getQueryFilters(): QueryFilter {
    const filters: QueryFilter = {};
    const stringFilters = ['account', 'party', 'referenceName'];

    for (const sf in stringFilters) {
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
    return [
      {
        fieldtype: 'Select',
        options: [
          { label: t`All`, value: 'All' },
          { label: t`Sales Invoices`, value: 'SalesInvoice' },
          { label: t`Purchase Invoices`, value: 'PurchaseInvoice' },
          { label: t`Payments`, value: 'Payment' },
          { label: t`Journal Entries`, value: 'JournalEntry' },
        ],

        label: t`Reference Type`,
        fieldname: 'referenceType',
        placeholder: t`Reference Type`,
        default: 'All',
      },
      {
        fieldtype: 'DynamicLink',
        placeholder: t`Reference Name`,
        references: 'referenceType',
        label: t`Reference Name`,
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
        fieldtype: 'Check',
        default: false,
        label: t`Cancelled`,
        fieldname: 'reverted',
      },
      {
        fieldtype: 'Check',
        default: false,
        label: t`Ascending`,
        fieldname: 'ascending',
      },
      {
        fieldtype: 'Check',
        default: 'none',
        label: t`Group By`,
        fieldname: 'groupBy',
        options: [
          { label: t`None`, value: 'none' },
          { label: t`Party`, value: 'party' },
          { label: t`Account`, value: 'account' },
          { label: t`Reference`, value: 'referenceName' },
        ],
      },
    ] as Field[];
  }

  getColumns(): ColumnField[] {
    let columns = [
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
        width: 0.75,
      },
      {
        label: t`Debit`,
        fieldtype: 'Currency',
        fieldname: 'debit',
        width: 1.25,
      },
      {
        label: t`Credit`,
        fieldtype: 'Currency',
        fieldname: 'credit',
        width: 1.25,
      },
      {
        label: t`Balance`,
        fieldtype: 'Currency',
        fieldname: 'balance',
        width: 1.25,
      },
      {
        label: t`Reference Type`,
        fieldtype: 'Data',
        fieldname: 'referenceType',
      },
      {
        label: t`Reference Name`,
        fieldtype: 'Data',
        fieldname: 'referenceName',
      },
      {
        label: t`Party`,
        fieldtype: 'Link',
        fieldname: 'party',
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

  getActions(): Action[] {
    return [];
  }
}
