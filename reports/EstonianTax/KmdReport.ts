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
import { exportVdXml } from './VdXmlExporter';
import { KmdBodyTotals, KmdReportData, VdLine, VdReportData } from './types';
import { getSavePath } from 'src/utils/ui';


export class KmdReport extends Report {
  static title = t`KMD (Estonian VAT Return)`;
  static reportName = 'KmdReport';

  year?: number;
  month?: number;
  loading = false;

  data?: KmdReportData;
  vdData?: VdReportData;

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
        label: 'KMD XML',
        type: 'primary',
        action: async () => {
          await this.exportKmdXml();
        },
      },
      {
        group: t`Export`,
        label: 'VD XML',
        type: 'secondary',
        action: async () => {
          await this.exportVdXml();
        },
      },
    ];
  }

  async setReportData(): Promise<void> {
    this.loading = true;
    try {
      const { kmd, vd } = await this.aggregate();
      this.data = kmd;
      this.vdData = vd;
      this.reportData = this.toReportRows(this.data.body);
    } finally {
      this.loading = false;
    }
  }

  private async aggregate(): Promise<{ kmd: KmdReportData; vd: VdReportData }> {
    const year = this.year!;
    const month = this.month!;
    const from = DateTime.fromObject({ year, month, day: 1 });
    const to = from.endOf('month');

    const body = emptyKmdBody();
    const taxPayerRegCode =
      (this.fyo.singles.AccountingSettings?.registryCode as string) ?? '';

    const liquidAccounts = (await this.fyo.db.getAllRaw('Account', {
      fields: ['name'],
      filters: { accountType: ['in', ['Bank', 'Cash']] },
    })) as Array<{ name: string }>;
    const liquidAccountNames = new Set(liquidAccounts.map((a) => a.name));

    const jeRows = (await this.fyo.db.getAllRaw(ModelNameEnum.JournalEntry, {
      fields: ['name', 'lhvVatCode', 'lhvArchivalId', 'euPartnerVat', 'entryType', 'date'],
      filters: {
        submitted: true,
        cancelled: false,
        date: ['>=', from.toISODate()!, '<=', to.toISODate()!],
      },
    })) as Array<{
      name: string;
      lhvVatCode?: string;
      lhvArchivalId?: string;
      euPartnerVat?: string;
      entryType?: string;
    }>;

    const vatTaggedJEs = jeRows.filter((j) => (j.lhvVatCode ?? '') !== '');
    const vdAccum = new Map<
      string,
      { goods: number; services: number; triangle: number }
    >();

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
          (r) => r.account === '2314 - RC VAT Receivable'
        );
        const rcPayable = accountRows.find(
          (r) => r.account === '2314 - RC VAT Payable'
        );
        body.inputVatTotal = round2(body.inputVatTotal + num(rcReceivable?.debit));
        body.rcVatPayable = round2(body.rcVatPayable + num(rcPayable?.credit));
        continue;
      }

      const net = computeNonBankNet(accountRows, liquidAccountNames);
      if (net === 0) continue;

      if (bucket.primary) {
        body[bucket.primary] = round2(body[bucket.primary] + net);
      }
      for (const extra of bucket.also ?? []) {
        body[extra] = round2(body[extra] + net);
      }
      if (bucket.side === 'purchase' && bucket.rate > 0) {
        body.inputVatTotal = round2(
          body.inputVatTotal + (net * bucket.rate) / 100
        );
      }

      if (bucket.vdColumn) {
        const partnerVat = (je.euPartnerVat ?? '').trim();
        if (partnerVat) {
          const acc = vdAccum.get(partnerVat) ?? {
            goods: 0,
            services: 0,
            triangle: 0,
          };
          acc[bucket.vdColumn] = round2(acc[bucket.vdColumn] + net);
          vdAccum.set(partnerVat, acc);
        }
      }
    }

    const vdLines: VdLine[] = [];
    for (const [partnerVat, acc] of vdAccum) {
      const { country, number } = splitVatNumber(partnerVat);
      vdLines.push({
        partnerCountry: country,
        partnerVatCode: number,
        goods: acc.goods,
        triangle: acc.triangle,
        services: acc.services,
      });
    }

    return {
      kmd: {
        taxPayerRegCode,
        year,
        month,
        version: pickVersion(year, month),
        declarationType: 1,
        body: round2Body(body),
        saleAnnex: [],
        purchaseAnnex: [],
      },
      vd: { taxPayerRegCode, year, month, lines: vdLines },
    };
  }

  private toReportRows(body: KmdBodyTotals): ReportData {
    type MoneyRow = { line: string; description: string; amount: number };
    type CountRow = { line: string; description: string; count: number };
    type RowSpec = MoneyRow | CountRow;

    const line4 = round2(
      body.transactions24 * 0.24 +
        body.transactions20 * 0.2 +
        body.transactions22 * 0.22 +
        body.transactions9 * 0.09 +
        body.transactions5 * 0.05 +
        body.transactions13 * 0.13
    );
    const vatBalance = round2(
      line4 + body.rcVatPayable + body.importVat - body.inputVatTotal + body.adjustmentsPlus - body.adjustmentsMinus
    );

    const rows: RowSpec[] = [
      { line: '1', description: t`24% taxable supplies`, amount: body.transactions24 },
      { line: '1¹', description: t`20% taxable supplies (legacy)`, amount: body.transactions20 },
      { line: '1²', description: t`22% taxable supplies (legacy)`, amount: body.transactions22 },
      { line: '2', description: t`9% taxable supplies`, amount: body.transactions9 },
      { line: '2¹', description: t`5% taxable supplies`, amount: body.transactions5 },
      { line: '2²', description: t`13% taxable supplies`, amount: body.transactions13 },
      { line: '3', description: t`0% supplies total`, amount: body.transactionsZeroVat },
      {
        line: '3.1',
        description: t`EU B2B supplies (incl. goods + services)`,
        amount: body.euSupplyInclGoodsAndServicesZeroVat,
      },
      { line: '3.1.1', description: t`EU goods supplies`, amount: body.euSupplyGoodsZeroVat },
      { line: '3.2', description: t`Exports outside EU`, amount: body.exportZeroVat },
      {
        line: '3.2.1',
        description: t`Sale to passengers with VAT refund`,
        amount: body.salePassengersWithReturnVat,
      },
      { line: '4', description: t`Total output VAT (computed)`, amount: line4 },
      {
        line: '4.1',
        description: t`VAT payable on import (+)`,
        amount: body.importVat,
      },
      { line: '5', description: t`Input VAT total (deductible)`, amount: body.inputVatTotal },
      { line: '5.1', description: t`VAT paid/payable on import`, amount: body.importVat },
      {
        line: '5.2',
        description: t`VAT on acquisition of fixed assets`,
        amount: body.fixedAssetsVat,
      },
      {
        line: '5.3',
        description: t`VAT on 100% business-use car + related`,
        amount: body.carsVat,
      },
      {
        line: '5.3',
        description: t`Number of 100% business-use cars`,
        count: body.numberOfCars,
      },
      {
        line: '5.4',
        description: t`VAT on partial-business car + related`,
        amount: body.carsPartialVat,
      },
      {
        line: '5.4',
        description: t`Number of partial-business cars`,
        count: body.numberOfCarsPartial,
      },
      {
        line: '6',
        description: t`EU acquisitions + RC services`,
        amount: body.euAcquisitionsGoodsAndServicesTotal,
      },
      { line: '6.1', description: t`EU goods acquisitions`, amount: body.euAcquisitionsGoods },
      {
        line: '7',
        description: t`Other purchases subject to VAT`,
        amount: body.acquisitionOtherGoodsAndServicesTotal,
      },
      {
        line: '7.1',
        description: t`Immovables / metal waste (§41¹)`,
        amount: body.acquisitionImmovablesAndScrapMetalAndGold,
      },
      { line: '8', description: t`Exempt supplies`, amount: body.supplyExemptFromTax },
      {
        line: '9',
        description: t`Supply under special arrangements (§41¹)`,
        amount: body.supplySpecialArrangements,
      },
      { line: '10', description: t`Adjustments (+)`, amount: body.adjustmentsPlus },
      { line: '11', description: t`Adjustments (-)`, amount: body.adjustmentsMinus },
      {
        line: '12',
        description: t`VAT payable (computed)`,
        amount: vatBalance >= 0 ? vatBalance : 0,
      },
      {
        line: '13',
        description: t`Overpaid VAT (computed)`,
        amount: vatBalance < 0 ? -vatBalance : 0,
      },
    ];

    return rows.map<ReportRow>((r) => ({
      cells: [
        { rawValue: r.line, value: r.line, width: 1, align: 'left' },
        { rawValue: r.description, value: r.description, width: 3, align: 'left' },
        'count' in r
          ? { rawValue: r.count, value: String(r.count), width: 1, align: 'right' }
          : {
              rawValue: r.amount,
              value: this.fyo.format(r.amount, 'Currency'),
              width: 1,
              align: 'right',
            },
      ],
    }));
  }

  private async exportKmdXml() {
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
    const yyyymm = `${this.data.year}-${String(this.data.month).padStart(2, '0')}`;
    const { filePath, canceled } = await getSavePath(`KMD_${yyyymm}`, 'xml');
    if (canceled || !filePath) return;

    await ipc.saveData(xml, filePath);
  }

  private async exportVdXml() {
    if (!this.vdData) {
      await this.setReportData();
    }
    if (!this.vdData) return;

    if (!this.vdData.taxPayerRegCode) {
      throw new Error(
        t`Set Registry Code in Accounting Settings before exporting VD.`
      );
    }

    if (this.vdData.lines.length === 0) {
      throw new Error(
        t`No intra-Community (EU B2B) supply in this period — VD report is not required.`
      );
    }

    const xml = exportVdXml(this.vdData);
    const yyyymm = `${this.vdData.year}-${String(this.vdData.month).padStart(2, '0')}`;
    const { filePath, canceled } = await getSavePath(`VD_${yyyymm}`, 'xml');
    if (canceled || !filePath) return;

    await ipc.saveData(xml, filePath);
  }
}

function splitVatNumber(vat: string): { country: string; number: string } {
  const m = /^([A-Za-z]{2})(.+)$/.exec(vat);
  if (m) return { country: m[1].toUpperCase(), number: m[2] };
  return { country: vat.slice(0, 2).toUpperCase(), number: vat };
}

function num(s: string | undefined): number {
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function computeNonBankNet(
  rows: Array<{ account: string; debit?: string; credit?: string }>,
  liquidAccounts: Set<string>
): number {
  let net = 0;
  for (const r of rows) {
    if (liquidAccounts.has(r.account)) continue;
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
