import { showMessageDialog } from '@/utils';
import frappe, { t } from 'fyo';
import { DateTime } from 'luxon';
import { stateCodeMap } from '../regional/in';
import { exportCsv, saveExportData } from '../reports/commonExporter';
import { getSavePath } from '../src/utils';

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
};

const CSGST = {
  'GST-0': 0,
  'GST-0.25': 0.125,
  'GST-3': 1.5,
  'GST-5': 2.5,
  'GST-6': 3,
  'GST-12': 6,
  'GST-18': 9,
  'GST-28': 14,
};

const IGST = {
  'IGST-0.25': 0.25,
  'IGST-3': 3,
  'IGST-5': 5,
  'IGST-6': 6,
  'IGST-12': 12,
  'IGST-18': 18,
  'IGST-28': 28,
};

export async function generateGstr1Json(getReportData) {
  const { gstin } = frappe.AccountingSettings;
  if (!gstin) {
    showMessageDialog({
      message: t`Export Failed`,
      description: t`Please set GSTIN in General Settings.`,
    });
    return;
  }

  const {
    rows,
    filters: { transferType, toDate },
  } = getReportData();

  const { filePath, canceled } = await getSavePath('gstr-1', 'json');
  if (canceled || !filePath) return;

  const gstData = {
    version: 'GST3.0.4',
    hash: 'hash',
    gstin: gstin,
    // fp is the the MMYYYY for the last month of the report
    // for example if you are extracting report for 1st July 2020 to 31st September 2020 then
    // fb = 092020
    fp: DateTime.fromISO(toDate).toFormat('MMyyyy'),
  };

  if (transferType === 'B2B') {
    gstData.b2b = await generateB2bData(rows);
  } else if (transferType === 'B2CL') {
    gstData.b2cl = await generateB2clData(rows);
  } else if (transferType === 'B2CS') {
    gstData.b2cs = await generateB2csData(rows);
  }

  const jsonData = JSON.stringify(gstData);
  await saveExportData(jsonData, filePath);
}

async function generateB2bData(rows) {
  const b2b = [];

  for (let row of rows) {
    const customer = {
      ctin: row.gstin,
      inv: [],
    };

    const invRecord = {
      inum: row.invNo,
      idt: DateTime.fromFormat(row.invDate, 'yyyy-MM-dd').toFormat(
        'dd-MM-yyyy'
      ),
      val: row.invAmt,
      pos: row.gstin && row.gstin.substring(0, 2),
      rchrg: row.reverseCharge,
      inv_typ: 'R',
      itms: [],
    };

    const items = await frappe.db.getAllRaw('SalesInvoiceItem', {
      fields: ['*'],
      filters: { parent: invRecord.inum },
    });

    items.forEach((item) => {
      const itemRecord = {
        num: item.hsnCode,
        itm_det: {
          txval: frappe.pesa(item.baseAmount).float,
          rt: GST[item.tax],
          csamt: 0,
          camt: frappe
            .pesa(CSGST[item.tax] || 0)
            .mul(item.baseAmount)
            .div(100).float,
          samt: frappe
            .pesa(CSGST[item.tax] || 0)
            .mul(item.baseAmount)
            .div(100).float,
          iamt: frappe
            .pesa(IGST[item.tax] || 0)
            .mul(item.baseAmount)
            .div(100).float,
        },
      };

      invRecord.itms.push(itemRecord);
    });

    const customerRecord = b2b.find((b) => b.ctin === row.gstin);

    if (customerRecord) {
      customerRecord.inv.push(invRecord);
    } else {
      customer.inv.push(invRecord);
      b2b.push(customer);
    }
  }

  return b2b;
}

async function generateB2clData(invoices) {
  const b2cl = [];

  for (let invoice of invoices) {
    const stateInvoiceRecord = {
      pos: stateCodeMap[invoice.place.toUpperCase()],
      inv: [],
    };

    const invRecord = {
      inum: invoice.invNo,
      idt: DateTime.fromFormat(invoice.invDate, 'yyyy-MM-dd').toFormat(
        'dd-MM-yyyy'
      ),
      val: invoice.invAmt,
      itms: [],
    };

    const items = await frappe.db.getAllRaw('SalesInvoiceItem', {
      fields: ['*'],
      filters: { parent: invRecord.inum },
    });

    items.forEach((item) => {
      const itemRecord = {
        num: item.hsnCode,
        itm_det: {
          txval: frappe.pesa(item.baseAmount).float,
          rt: GST[item.tax],
          csamt: 0,
          iamt: frappe
            .pesa(invoice.rate || 0)
            .mul(item.baseAmount)
            .div(100).float,
        },
      };

      invRecord.itms.push(itemRecord);
    });

    const stateRecord = b2cl.find((b) => b.pos === stateCodeMap[invoice.place]);

    if (stateRecord) {
      stateRecord.inv.push(invRecord);
    } else {
      stateInvoiceRecord.inv.push(invRecord);
      b2cl.push(stateInvoiceRecord);
    }
  }

  return b2cl;
}

async function generateB2csData(invoices) {
  const b2cs = [];

  for (let invoice of invoices) {
    const pos = invoice.place.toUpperCase();

    const invRecord = {
      sply_ty: invoice.inState ? 'INTRA' : 'INTER',
      pos: stateCodeMap[pos],
      // "OE" - Abbreviation for errors and omissions excepted.
      typ: 'OE',
      txval: invoice.taxVal,
      rt: invoice.rate,
      iamt: !invoice.inState ? (invoice.taxVal * invoice.rate) / 100 : 0,
      camt: invoice.inState ? invoice.cgstAmt : 0,
      samt: invoice.inState ? invoice.sgstAmt : 0,
      csamt: 0,
    };

    b2cs.push(invRecord);
  }

  return b2cs;
}

export async function generateGstr2Csv(getReportData) {
  const { gstin } = frappe.AccountingSettings;
  if (!gstin) {
    showMessageDialog({
      message: t`Export Failed`,
      description: t`Please set GSTIN in General Settings.`,
    });
    return;
  }

  const {
    rows,
    columns,
    filters: { transferType, toDate },
  } = getReportData();

  const { filePath, canceled } = await getSavePath('gstr-2', 'csv');
  if (canceled || !filePath) return;

  let gstData;
  if (transferType === 'B2B') {
    gstData = await generateB2bCsvGstr2(rows, columns);
  }

  await exportCsv(gstData.rows, gstData.columns, filePath);
}

async function generateB2bCsvGstr2(rows, columns) {
  const csvColumns = [
    {
      label: t`GSTIN of Supplier`,
      fieldname: 'gstin',
    },
    {
      label: t`Invoice Number`,
      fieldname: 'invNo',
    },
    {
      label: t`Invoice Date`,
      fieldname: 'invDate',
    },
    {
      label: t`Invoice Value`,
      fieldname: 'invAmt',
    },
    {
      label: t`Place of supply`,
      fieldname: 'place',
    },
    {
      label: t`Reverse Charge`,
      fieldname: 'reverseCharge',
    },
    {
      label: t`Rate`,
      fieldname: 'rate',
    },
    {
      label: t`Taxable Value`,
      fieldname: 'taxVal',
    },
    {
      label: t`Intergrated Tax Paid`,
      fieldname: 'igstAmt',
    },
    {
      label: t`Central Tax Paid`,
      fieldname: 'cgstAmt',
    },
    {
      label: t`State/UT Tax Paid`,
      fieldname: 'sgstAmt',
    },
  ];

  return {
    columns: csvColumns || [],
    rows: rows || [],
  };
}

export async function generateGstr1Csv(getReportData) {
  const { gstin } = frappe.AccountingSettings;
  if (!gstin) {
    showMessageDialog({
      message: t`Export Failed`,
      description: t`Please set GSTIN in General Settings.`,
    });
    return;
  }

  const {
    rows,
    columns,
    filters: { transferType, toDate },
  } = getReportData();

  const { filePath, canceled } = await getSavePath('gstr-1', 'csv');
  if (canceled || !filePath) return;

  await exportCsv(rows, columns, filePath);
}
