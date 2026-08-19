import { t } from 'fyo';
import { Action } from 'fyo/model/types';
import { DateTime } from 'luxon';
import { Invoice } from 'models/baseModels/Invoice/Invoice';
import { Party } from 'models/regionalModels/in/Party';
import { ModelNameEnum } from 'models/types';
import { codeStateMap } from 'regional/in';
import { Report } from 'reports/Report';
import { ColumnField, ReportData, ReportRow } from 'reports/types';
import { Field, OptionField } from 'schemas/types';
import { isNumeric } from 'src/utils';
import getGSTRExportActions from './gstExporter';
import { GSTRRow, GSTRType, TransferType, TransferTypeEnum } from './types';

export abstract class BaseGSTR extends Report {
  place?: string;
  toDate?: string;
  fromDate?: string;
  transferType?: TransferType;
  usePagination = true;
  gstrRows?: GSTRRow[];
  loading = false;

  abstract gstrType: GSTRType;

  get transferTypeMap(): Record<string, string> {
    if (this.gstrType === 'GSTR-2') {
      return {
        B2B: 'B2B',
      };
    }

    return {
      B2B: 'B2B',
      B2CL: 'B2C-Large',
      B2CS: 'B2C-Small',
      NR: 'Nil Rated, Exempted and Non GST supplies',
    };
  }

  get schemaName() {
    if (this.gstrType === 'GSTR-1') {
      return ModelNameEnum.SalesInvoice;
    }

    return ModelNameEnum.PurchaseInvoice;
  }

  async setReportData(): Promise<void> {
    this.loading = true;
    const gstrRows = await this.getGstrRows();
    const filteredRows = this.filterGstrRows(gstrRows);
    this.gstrRows = filteredRows;
    this.reportData = this.getReportDataFromGSTRRows(filteredRows);
    this.loading = false;
  }

  getReportDataFromGSTRRows(gstrRows: GSTRRow[]): ReportData {
    const reportData: ReportData = [];
    for (const row of gstrRows) {
      const reportRow: ReportRow = { cells: [] };

      for (const { fieldname, fieldtype, width } of this.columns) {
        const align = isNumeric(fieldtype) ? 'right' : 'left';

        const rawValue = row[fieldname as keyof GSTRRow];
        let value = '';
        if (rawValue !== undefined) {
          value = this.fyo.format(rawValue, fieldtype);
        }

        reportRow.cells.push({
          align,
          rawValue,
          value,
          width: width ?? 1,
        });
      }

      reportData.push(reportRow);
    }

    return reportData;
  }

  filterGstrRows(gstrRows: GSTRRow[]) {
    return gstrRows.filter((row) => {
      let allow = true;
      if (this.place) {
        allow &&= codeStateMap[this.place] === row.place;
      }
      this.place;
      return (allow &&= this.transferFilterFunction(row));
    });
  }

  get transferFilterFunction(): (row: GSTRRow) => boolean {
    if (this.transferType === 'B2B') {
      return (row) => !!row.gstin;
    }

    if (this.transferType === 'B2CL') {
      return (row) => !row.gstin && !row.inState && row.invAmt >= 250000;
    }

    if (this.transferType === 'B2CS') {
      return (row) => !row.gstin && (row.inState || row.invAmt < 250000);
    }

    if (this.transferType === 'NR') {
      return (row) => row.rate === 0; // this takes care of both nil rated, exempted goods
    }

    return () => true;
  }

  async getEntries() {
    const date: string[] = [];
    if (this.toDate) {
      date.push('<=', this.toDate);
    }

    if (this.fromDate) {
      date.push('>=', this.fromDate);
    }

    return (await this.fyo.db.getAllRaw(this.schemaName, {
      filters: { date, submitted: true, cancelled: false },
    })) as { name: string }[];
  }

  async getGstrRows(): Promise<GSTRRow[]> {
    const entries = await this.getEntries();
    const gstrRows: GSTRRow[] = [];
    for (const entry of entries) {
      const gstrRow = await this.getGstrRow(entry.name);
      gstrRows.push(gstrRow);
    }
    return gstrRows;
  }

  async getGstrRow(entryName: string): Promise<GSTRRow> {
    const entry = (await this.fyo.doc.getDoc(
      this.schemaName,
      entryName
    )) as Invoice;
    const gstin = (await this.fyo.getValue(
      ModelNameEnum.AccountingSettings,
      'gstin'
    )) as string | null;

    const party = (await this.fyo.doc.getDoc('Party', entry.party)) as Party;

    let place = '';
    if (party.address) {
      const pos = (await this.fyo.getValue(
        ModelNameEnum.Address,
        party.address as string,
        'pos'
      )) as string | undefined;

      place = pos ?? '';
    } else if (party.gstin) {
      const code = party.gstin.slice(0, 2);
      place = codeStateMap[code] ?? '';
    }

    let inState = false;
    if (gstin) {
      inState = codeStateMap[gstin.slice(0, 2)] === place;
    }

    const gstrRow: GSTRRow = {
      gstin: party.gstin ?? '',
      partyName: entry.party!,
      invNo: entry.name!,
      invDate: entry.date!,
      rate: 0,
      reverseCharge: !party.gstin ? 'Y' : 'N',
      inState,
      place,
      invAmt: entry.grandTotal?.float ?? 0,
      taxVal: entry.netTotal?.float ?? 0,
    };

    for (const tax of entry.taxes ?? []) {
      gstrRow.rate += tax.rate ?? 0;
    }

    this.setTaxValuesOnGSTRRow(entry, gstrRow);
    return gstrRow;
  }

  setTaxValuesOnGSTRRow(entry: Invoice, gstrRow: GSTRRow) {
    for (const tax of entry.taxes ?? []) {
      const rate = tax.rate ?? 0;
      gstrRow.rate += rate;
      const taxAmt = entry.netTotal!.percent(rate).float;

      switch (tax.account) {
        case 'IGST': {
          gstrRow.igstAmt = taxAmt;
          gstrRow.inState = false;
        }
        case 'CGST':
          gstrRow.cgstAmt = taxAmt;
        case 'SGST':
          gstrRow.sgstAmt = taxAmt;
        case 'Nil Rated':
          gstrRow.nilRated = true;
        case 'Exempt':
          gstrRow.exempt = true;
        case 'Non GST':
          gstrRow.nonGST = true;
      }
    }
  }

  setDefaultFilters() {
    if (!this.toDate) {
      this.toDate = DateTime.local().toISODate();
    }

    if (!this.fromDate) {
      this.fromDate = DateTime.local().minus({ months: 3 }).toISODate();
    }

    if (!this.transferType) {
      this.transferType = 'B2B';
    }
  }

  getFilters(): Field[] {
    const transferTypeMap = this.transferTypeMap;
    const options = Object.keys(transferTypeMap).map((k) => ({
      value: k,
      label: transferTypeMap[k],
    }));

    return [
      {
        fieldtype: 'Select',
        label: t`Transfer Type`,
        placeholder: t`Transfer Type`,
        fieldname: 'transferType',
        options,
      } as OptionField,
      {
        fieldtype: 'AutoComplete',
        label: t`Place`,
        placeholder: t`Place`,
        fieldname: 'place',
        options: Object.keys(codeStateMap).map((code) => {
          return {
            value: code,
            label: codeStateMap[code],
          };
        }),
      } as OptionField,
      {
        fieldtype: 'Date',
        label: t`From Date`,
        placeholder: t`From Date`,
        fieldname: 'fromDate',
      },
      {
        fieldtype: 'Date',
        label: t`To Date`,
        placeholder: t`To Date`,
        fieldname: 'toDate',
      },
    ];
  }

  getColumns(): ColumnField[] | Promise<ColumnField[]> {
    const columns = [
      {
        label: t`Party`,
        fieldtype: 'Data',
        fieldname: 'partyName',
        width: 1.5,
      },
      {
        label: t`Invoice No.`,
        fieldname: 'invNo',
        fieldtype: 'Data',
      },
      {
        label: t`Invoice Value`,
        fieldname: 'invAmt',
        fieldtype: 'Currency',
      },
      {
        label: t`Invoice Date`,
        fieldname: 'invDate',
        fieldtype: 'Date',
      },
      {
        label: t`Place of supply`,
        fieldname: 'place',
        fieldtype: 'Data',
      },
      {
        label: t`Rate`,
        fieldname: 'rate',
        width: 0.5,
      },
      {
        label: t`Taxable Value`,
        fieldname: 'taxVal',
        fieldtype: 'Currency',
      },
      {
        label: t`Reverse Chrg.`,
        fieldname: 'reverseCharge',
        fieldtype: 'Data',
      },
      {
        label: t`Intergrated Tax`,
        fieldname: 'igstAmt',
        fieldtype: 'Currency',
      },
      {
        label: t`Central Tax`,
        fieldname: 'cgstAmt',
        fieldtype: 'Currency',
      },
      {
        label: t`State Tax`,
        fieldname: 'sgstAmt',
        fieldtype: 'Currency',
      },
    ] as ColumnField[];

    const transferType = this.transferType ?? TransferTypeEnum.B2B;
    if (transferType === TransferTypeEnum.B2B) {
      columns.unshift({
        label: t`GSTIN No.`,
        fieldname: 'gstin',
        fieldtype: 'Data',
        width: 1.5,
      });
    }

    return columns;
  }

  getActions(): Action[] {
    return getGSTRExportActions(this);
  }
}
