import { t } from 'fyo';
import { Action } from 'fyo/model/types';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import { VatCodeName } from 'regional/ee';
import { Report } from 'reports/Report';
import { ColumnField, ReportData, ReportRow } from 'reports/types';
import { Field } from 'schemas/types';
import { emptyKmdBody, pickVersion, VAT_CODE_TO_BUCKET } from './lineMap';
import { exportKmdXml } from './KmdXmlExporter';
import { KmdBodyTotals, KmdReportData } from './types';
import { getSavePath } from 'src/utils/ui';

const BANK_ACCOUNT_NAMES = new Set(['Bank - LHV']);

export class KmdReport extends Report {
  static title = t`KMD (Estonian VAT Return)`;
  static reportName = 'KmdReport';

  year?: number;
  month?: number;
  loading = false;

  data?: KmdReportData;

  async setDefaultFilters(): Promise<void> {
    if (!this.year || !this.month) {
      const now = DateTime.local().minus({ months: 1 });
      this.year ??= now.year;
      this.month ??= now.month;
    }
    return Promise.resolve();
  }

  getFilters(): Field[] {
    return [
      {
        fieldname: 'year',
        label: t`Year`,
        fieldtype: 'Int',
        required: true,
      },
      {
        fieldname: 'month',
        label: t`Month`,
        fieldtype: 'Int',
        required: true,
      },
    ];
  }

  getColumns(): ColumnField[] {
    return [
      {
        fieldname: 'line',
        label: t`KMD Line`,
        fieldtype: 'Data',
        width: 1,
      } as ColumnField,
      {
        fieldname: 'description',
        label: t`Description`,
        fieldtype: 'Data',
        width: 3,
      } as ColumnField,
      {
        fieldname: 'amount',
        label: t`Amount (EUR)`,
        fieldtype: 'Currency',
        width: 1,
      } as ColumnField,
    ];
  }

  getActions(): Action[] {
    return [
      {
        group: t`Export`,
        label: 'XML',
        type: 'primary',
        action: async () => {
          await this.exportXml();
        },
      },
    ];
  }

  async setReportData(): Promise<void> {
    this.loading = true;
    try {
      this.data = await this.aggregate();
      this.reportData = this.toReportRows(this.data.body);
    } finally {
      this.loading = false;
    }
  }

  private async aggregate(): Promise<KmdReportData> {
    const year = this.year!;
    const month = this.month!;
    const from = DateTime.fromObject({ year, month, day: 1 });
    const to = from.endOf('month');

    const body = emptyKmdBody();
    const taxPayerRegCode =
      (this.fyo.singles.AccountingSettings?.registryCode as string) ?? '';

    const jeRows = (await this.fyo.db.getAllRaw(ModelNameEnum.JournalEntry, {
      fields: ['name', 'lhvVatCode', 'lhvArchivalId', 'entryType', 'date'],
      filters: {
        submitted: true,
        cancelled: false,
        date: ['>=', from.toISODate()!, '<=', to.toISODate()!],
      },
    })) as Array<{
      name: string;
      lhvVatCode?: string;
      lhvArchivalId?: string;
      entryType?: string;
    }>;

    const vatTaggedJEs = jeRows.filter((j) => (j.lhvVatCode ?? '') !== '');

    for (const je of vatTaggedJEs) {
      const vatCode = je.lhvVatCode as VatCodeName;
      const bucket = VAT_CODE_TO_BUCKET[vatCode];
      if (!bucket) continue;

      const accountRows = (await this.fyo.db.getAllRaw(
        ModelNameEnum.JournalEntryAccount,
        {
          fields: ['account', 'debit', 'credit'],
          filters: { parent: je.name },
        }
      )) as Array<{ account: string; debit?: string; credit?: string }>;

      const isRcSelfAssess = (je.lhvArchivalId ?? '').endsWith('-RC');

      if (isRcSelfAssess) {
        const rcReceivable = accountRows.find(
          (r) => r.account === 'Reverse Charge VAT Receivable'
        );
        const vat = num(rcReceivable?.debit);
        body.inputVatTotal += vat;
        continue;
      }

      const net = computeNonBankNet(accountRows);
      if (net === 0) continue;

      body[bucket.primary] = round2(body[bucket.primary] + net);
      for (const extra of bucket.also ?? []) {
        body[extra] = round2(body[extra] + net);
      }
      if (bucket.side === 'purchase' && bucket.rate > 0) {
        body.inputVatTotal = round2(
          body.inputVatTotal + (net * bucket.rate) / 100
        );
      }
    }

    return {
      taxPayerRegCode,
      year,
      month,
      version: pickVersion(year, month),
      declarationType: 1,
      body: round2Body(body),
      saleAnnex: [],
      purchaseAnnex: [],
    };
  }

  private toReportRows(body: KmdBodyTotals): ReportData {
    const rows: Array<{ line: string; description: string; amount: number }> = [
      {
        line: '1',
        description: t`24% taxable supplies`,
        amount: body.transactions24,
      },
      {
        line: '1¹',
        description: t`20% taxable supplies (legacy)`,
        amount: body.transactions20,
      },
      {
        line: '1²',
        description: t`22% taxable supplies (legacy)`,
        amount: body.transactions22,
      },
      {
        line: '2',
        description: t`9% taxable supplies`,
        amount: body.transactions9,
      },
      {
        line: '2¹',
        description: t`5% taxable supplies`,
        amount: body.transactions5,
      },
      {
        line: '2²',
        description: t`13% taxable supplies`,
        amount: body.transactions13,
      },
      {
        line: '3',
        description: t`0% supplies total`,
        amount: body.transactionsZeroVat,
      },
      {
        line: '3.1',
        description: t`EU B2B supplies`,
        amount: body.euSupplyInclGoodsAndServicesZeroVat,
      },
      {
        line: '3.1.1',
        description: t`EU goods supplies`,
        amount: body.euSupplyGoodsZeroVat,
      },
      {
        line: '3.2',
        description: t`Exports outside EU`,
        amount: body.exportZeroVat,
      },
      {
        line: '5',
        description: t`Input VAT total (deductible)`,
        amount: body.inputVatTotal,
      },
      {
        line: '6',
        description: t`EU acquisitions + RC services`,
        amount: body.euAcquisitionsGoodsAndServicesTotal,
      },
      {
        line: '6.1',
        description: t`EU goods acquisitions`,
        amount: body.euAcquisitionsGoods,
      },
      {
        line: '7',
        description: t`Other purchases subject to VAT`,
        amount: body.acquisitionOtherGoodsAndServicesTotal,
      },
      {
        line: '8',
        description: t`Exempt supplies`,
        amount: body.supplyExemptFromTax,
      },
      {
        line: '10',
        description: t`Adjustments (+)`,
        amount: body.adjustmentsPlus,
      },
      {
        line: '11',
        description: t`Adjustments (-)`,
        amount: body.adjustmentsMinus,
      },
    ];

    return rows.map<ReportRow>((r) => ({
      cells: [
        { rawValue: r.line, value: r.line, width: 1, align: 'left' },
        {
          rawValue: r.description,
          value: r.description,
          width: 3,
          align: 'left',
        },
        {
          rawValue: r.amount,
          value: this.fyo.format(r.amount, 'Currency'),
          width: 1,
          align: 'right',
        },
      ],
    }));
  }

  private async exportXml() {
    if (!this.data) {
      await this.setReportData();
    }
    if (!this.data) return;

    if (!this.data.taxPayerRegCode) {
      throw new Error(
        t`Set Registry Code in Accounting Settings before exporting KMD.`
      );
    }

    const xml = exportKmdXml(this.data);
    const yyyymm = `${this.data.year}-${String(this.data.month).padStart(
      2,
      '0'
    )}`;
    const { filePath, canceled } = await getSavePath(`KMD_${yyyymm}`, 'xml');
    if (canceled || !filePath) return;

    await ipc.saveData(xml, filePath);
  }
}

function num(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function computeNonBankNet(
  rows: Array<{ account: string; debit?: string; credit?: string }>
): number {
  let net = 0;
  for (const r of rows) {
    if (BANK_ACCOUNT_NAMES.has(r.account)) continue;
    net += num(r.debit) + num(r.credit);
  }
  return round2(net);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round2Body(b: KmdBodyTotals): KmdBodyTotals {
  const out = { ...b };
  for (const k of Object.keys(out) as (keyof KmdBodyTotals)[]) {
    out[k] = round2(out[k]);
  }
  return out;
}
