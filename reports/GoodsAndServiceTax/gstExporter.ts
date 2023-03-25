import { Action } from 'fyo/model/types';
import { Verb } from 'fyo/telemetry/types';
import { DateTime } from 'luxon';
import { ModelNameEnum } from 'models/types';
import { codeStateMap } from 'regional/in';
import { ExportExtention } from 'reports/types';
import { showDialog } from 'src/utils/interactive';
import { getSavePath } from 'src/utils/ipcCalls';
import { invertMap } from 'utils';
import { getCsvData, saveExportData } from '../commonExporter';
import { BaseGSTR } from './BaseGSTR';
import { TransferTypeEnum } from './types';

const GST = {
  'GST-0': 0,
  'GST-0.25': 0.25,
  'GST-3': 3,
  'GST-5': 5,
  'GST-6': 6,
  'GST-12': 12,
  'GST-18': 18,
  'GST-28': 28,
  'IGST-0': 0,
  'IGST-0.25': 0.25,
  'IGST-3': 3,
  'IGST-5': 5,
  'IGST-6': 6,
  'IGST-12': 12,
  'IGST-18': 18,
  'IGST-28': 28,
} as Record<string, number>;

const CSGST = {
  'GST-0': 0,
  'GST-0.25': 0.125,
  'GST-3': 1.5,
  'GST-5': 2.5,
  'GST-6': 3,
  'GST-12': 6,
  'GST-18': 9,
  'GST-28': 14,
} as Record<string, number>;

const IGST = {
  'IGST-0.25': 0.25,
  'IGST-3': 3,
  'IGST-5': 5,
  'IGST-6': 6,
  'IGST-12': 12,
  'IGST-18': 18,
  'IGST-28': 28,
} as Record<string, number>;

interface GSTData {
  version: string;
  hash: string;
  gstin: string;
  fp: string;
  b2b?: B2BCustomer[];
  b2cl?: B2CLStateInvoiceRecord[];
  b2cs?: B2CSInvRecord[];
}

interface B2BCustomer {
  ctin: string;
  inv: B2BInvRecord[];
}

interface B2BInvRecord {
  inum: string;
  idt: string;
  val: number;
  pos: string;
  rchrg: 'Y' | 'N';
  inv_typ: string;
  itms: B2BItmRecord[];
}

interface B2BItmRecord {
  num: number;
  itm_det: {
    txval: number;
    rt: number;
    csamt: number;
    camt: number;
    samt: number;
    iamt: number;
  };
}

interface B2CLInvRecord {
  inum: string;
  idt: string;
  val: number;
  itms: B2CLItmRecord[];
}

interface B2CLItmRecord {
  num: number;
  itm_det: {
    txval: number;
    rt: number;
    csamt: 0;
    iamt: number;
  };
}

interface B2CLStateInvoiceRecord {
  pos: string;
  inv: B2CLInvRecord[];
}

interface B2CSInvRecord {
  sply_ty: 'INTRA' | 'INTER';
  pos: string;
  typ: 'OE'; // "OE" -  Errors and omissions excepted.
  txval: number;
  rt: number;
  iamt: number;
  camt: number;
  samt: number;
  csamt: number;
}

export default function getGSTRExportActions(report: BaseGSTR): Action[] {
  const exportExtention = ['csv', 'json'] as ExportExtention[];

  return exportExtention.map((ext) => ({
    group: `Export`,
    label: ext.toUpperCase(),
    type: 'primary',
    action: async () => {
      await exportReport(ext, report);
    },
  }));
}

async function exportReport(extention: ExportExtention, report: BaseGSTR) {
  const canExport = await getCanExport(report);
  if (!canExport) {
    return;
  }

  const { filePath, canceled } = await getSavePath(
    report.reportName,
    extention
  );

  if (canceled || !filePath) {
    return;
  }

  let data = '';

  if (extention === 'csv') {
    data = getCsvData(report);
  } else if (extention === 'json') {
    data = await getGstrJsonData(report);
  }

  if (!data.length) {
    return;
  }

  await saveExportData(data, filePath);
  report.fyo.telemetry.log(Verb.Exported, report.reportName, { extention });
}

async function getCanExport(report: BaseGSTR) {
  const gstin = await report.fyo.getValue(
    ModelNameEnum.AccountingSettings,
    'gstin'
  );
  if (gstin) {
    return true;
  }

  showDialog({
    title: report.fyo.t`Cannot Export`,
    detail: report.fyo.t`Please set GSTIN in General Settings.`,
    type: 'error',
  });

  return false;
}

export async function getGstrJsonData(report: BaseGSTR): Promise<string> {
  const toDate = report.toDate!;
  const transferType = report.transferType!;
  const gstin = await report.fyo.getValue(
    ModelNameEnum.AccountingSettings,
    'gstin'
  );

  const gstData: GSTData = {
    version: 'GST3.0.4',
    hash: 'hash',
    gstin: gstin as string,
    fp: DateTime.fromISO(toDate).toFormat('MMyyyy'),
  };

  if (transferType === TransferTypeEnum.B2B) {
    gstData.b2b = await generateB2bData(report);
  } else if (transferType === TransferTypeEnum.B2CL) {
    gstData.b2cl = await generateB2clData(report);
  } else if (transferType === TransferTypeEnum.B2CS) {
    gstData.b2cs = await generateB2csData(report);
  }

  return JSON.stringify(gstData);
}

async function generateB2bData(report: BaseGSTR): Promise<B2BCustomer[]> {
  const fyo = report.fyo;
  const b2b: B2BCustomer[] = [];

  const schemaName =
    report.gstrType === 'GSTR-1'
      ? ModelNameEnum.SalesInvoiceItem
      : ModelNameEnum.PurchaseInvoiceItem;

  const parentSchemaName =
    report.gstrType === 'GSTR-1'
      ? ModelNameEnum.SalesInvoice
      : ModelNameEnum.PurchaseInvoice;

  for (const row of report.gstrRows ?? []) {
    const invRecord: B2BInvRecord = {
      inum: row.invNo,
      idt: DateTime.fromJSDate(row.invDate).toFormat('dd-MM-yyyy'),
      val: row.invAmt,
      pos: row.gstin && row.gstin.substring(0, 2),
      rchrg: row.reverseCharge,
      inv_typ: 'R',
      itms: [],
    };

    const exchangeRate = (
      await fyo.db.getAllRaw(parentSchemaName, {
        fields: ['exchangeRate'],
        filters: { name: invRecord.inum },
      })
    )[0].exchangeRate as number;

    const items = await fyo.db.getAllRaw(schemaName, {
      fields: ['amount', 'tax', 'hsnCode'],
      filters: { parent: invRecord.inum },
    });

    items.forEach((item) => {
      const hsnCode = item.hsnCode as number;
      const tax = item.tax as string;
      const baseAmount = fyo
        .pesa((item.amount as string) ?? 0)
        .mul(exchangeRate);

      const itemRecord: B2BItmRecord = {
        num: hsnCode,
        itm_det: {
          txval: baseAmount.float,
          rt: GST[tax],
          csamt: 0,
          camt: fyo
            .pesa(CSGST[tax] ?? 0)
            .mul(baseAmount)
            .div(100).float,
          samt: fyo
            .pesa(CSGST[tax] ?? 0)
            .mul(baseAmount)
            .div(100).float,
          iamt: fyo
            .pesa(IGST[tax] ?? 0)
            .mul(baseAmount)
            .div(100).float,
        },
      };

      invRecord.itms.push(itemRecord);
    });

    const customerRecord = b2b.find((b) => b.ctin === row.gstin);
    const customer = {
      ctin: row.gstin,
      inv: [],
    } as B2BCustomer;

    if (customerRecord) {
      customerRecord.inv.push(invRecord);
    } else {
      customer.inv.push(invRecord);
      b2b.push(customer);
    }
  }

  return b2b;
}

async function generateB2clData(
  report: BaseGSTR
): Promise<B2CLStateInvoiceRecord[]> {
  const fyo = report.fyo;
  const b2cl: B2CLStateInvoiceRecord[] = [];
  const stateCodeMap = invertMap(codeStateMap);

  const schemaName =
    report.gstrType === 'GSTR-1'
      ? ModelNameEnum.SalesInvoiceItem
      : ModelNameEnum.PurchaseInvoiceItem;

  const parentSchemaName =
    report.gstrType === 'GSTR-1'
      ? ModelNameEnum.SalesInvoice
      : ModelNameEnum.PurchaseInvoice;

  for (const row of report.gstrRows ?? []) {
    const invRecord: B2CLInvRecord = {
      inum: row.invNo,
      idt: DateTime.fromJSDate(row.invDate).toFormat('dd-MM-yyyy'),
      val: row.invAmt,
      itms: [],
    };

    const exchangeRate = (
      await fyo.db.getAllRaw(parentSchemaName, {
        fields: ['exchangeRate'],
        filters: { name: invRecord.inum },
      })
    )[0].exchangeRate as number;

    const items = await fyo.db.getAllRaw(schemaName, {
      fields: ['amount', 'tax', 'hsnCode'],
      filters: { parent: invRecord.inum },
    });

    items.forEach((item) => {
      const hsnCode = item.hsnCode as number;
      const tax = item.tax as string;
      const baseAmount = fyo
        .pesa((item.amount as string) ?? 0)
        .mul(exchangeRate);

      const itemRecord: B2CLItmRecord = {
        num: hsnCode,
        itm_det: {
          txval: baseAmount.float,
          rt: GST[tax] ?? 0,
          csamt: 0,
          iamt: fyo
            .pesa(row.rate ?? 0)
            .mul(baseAmount)
            .div(100).float,
        },
      };

      invRecord.itms.push(itemRecord);
    });

    const stateRecord = b2cl.find((b) => b.pos === stateCodeMap[row.place]);
    const stateInvoiceRecord: B2CLStateInvoiceRecord = {
      pos: stateCodeMap[row.place],
      inv: [],
    };

    if (stateRecord) {
      stateRecord.inv.push(invRecord);
    } else {
      stateInvoiceRecord.inv.push(invRecord);
      b2cl.push(stateInvoiceRecord);
    }
  }

  return b2cl;
}

function generateB2csData(report: BaseGSTR): B2CSInvRecord[] {
  const stateCodeMap = invertMap(codeStateMap);
  const b2cs: B2CSInvRecord[] = [];

  for (const row of report.gstrRows ?? []) {
    const invRecord: B2CSInvRecord = {
      sply_ty: row.inState ? 'INTRA' : 'INTER',
      pos: stateCodeMap[row.place],
      typ: 'OE',
      txval: row.taxVal,
      rt: row.rate,
      iamt: !row.inState ? (row.taxVal * row.rate) / 100 : 0,
      camt: row.inState ? row.cgstAmt ?? 0 : 0,
      samt: row.inState ? row.sgstAmt ?? 0 : 0,
      csamt: 0,
    };

    b2cs.push(invRecord);
  }

  return b2cs;
}
