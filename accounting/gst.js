import frappe from 'frappejs';
import { _ } from 'frappejs/utils';
import { IPC_ACTIONS } from '@/messages';
import { ipcRenderer } from 'electron';
import { DateTime } from 'luxon';
import { sleep } from 'frappejs/utils';
import { makeJSON, promptWhenGstUnavailable } from '@/utils';

/**
 * GST is a map which gives a final rate for any given gst item
 * eg: IGST-18 = 18
 * eg: GST-18 = CGST-9 + SGST-9 = 18
 */
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

/**
 * CSGST is a map which return the tax rate component for state or central
 * eg: GST-12 = 6
 */
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

/**
 * IGST is a map which return the tax rate for the igst item
 * eg: IGST-18 = 18
 */
const IGST = {
  'IGST-0.25': 0.25,
  'IGST-3': 3,
  'IGST-5': 5,
  'IGST-6': 6,
  'IGST-12': 12,
  'IGST-18': 18,
  'IGST-28': 28,
};

export async function generateGstr1Json(report, { transferType, toDate }) {
  const printSettings = await frappe.getSingle('PrintSettings');

  if (!printSettings.gstin) promptWhenGstUnavailable();
  else {
    const savePath = await getSavePath();
    if (!savePath) return;

    const gstData = {
      version: 'GST3.0.4',
      hash: 'hash',
      // fp is the the MMYYYY for the last month of the report
      // for example if you are extracting report for 1st July 2020 to 31st September 2020 then
      // fb = 092020
      fp: DateTime.fromISO(toDate).toFormat('MMyyyy'),
      gstin: printSettings.gstin,
    };

    // based condition we need to triggered different methods
    if (transferType === 'B2B') {
      gstData.b2b = await getB2bData(report.rows);
    } else if (transferType === 'B2CL') {
      gstData.b2cl = await getB2clData(report.rows);
    } else if (transferType === 'B2CS') {
      gstData.b2cs = await getB2csData(report.rows);
    }

    await sleep(1);
    const jsonData = JSON.stringify(gstData);
    makeJSON(jsonData, savePath);
  }
}

async function getB2bData(invoices) {
  const b2b = [];

  invoices.forEach(async (row) => {
    // it's must for the customer to have a gstin, if not it should not be here
    const customer = {
      ctin: row.gstin,
      inv: [],
    };

    const invRecord = {
      inum: row.invNo,
      idt: DateTime.fromFormat(row.invDate, 'yyyy-MM-dd').toFormat(
        'dd-MM-yyyy'
      ),
      value: row.invAmt,
      pos: row.gstin && row.gstin.substring(0, 2),
      rchrg: row.reverseCharge,
      itms: [],
    };

    let items = await frappe.db
      .knex('SalesInvoiceItem')
      .where('parent', invRecord.inum);

    items.forEach((item) => {
      const itemRecord = {
        num: item.item_code || 1801, // TODO: will be replaced by HSN CODE (item code)
        itm_det: {
          txval: item.baseAmount,
          rt: GST[item.tax],
          csamt: 0,
          camt: ((CSGST[item.tax] || 0) * item.baseAmount) / 100,
          samt: ((CSGST[item.tax] || 0) * item.baseAmount) / 100,
          iamt: ((IGST[item.tax] || 0) * item.baseAmount) / 100,
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
  });

  return b2b;
}

async function getB2clData(invoices) {
  return [];
}

async function getB2csData(invoices) {
  return [];
}

async function getSavePath(name = 'gstr1') {
  const options = {
    title: _('Select folder'),
    defaultPath: `${name}.json`,
  };

  let { filePath } = await ipcRenderer.invoke(
    IPC_ACTIONS.GET_SAVE_FILEPATH,
    options
  );

  if (filePath) {
    if (!filePath.endsWith('.json')) {
      filePath = filePath + '.json';
    }
  }

  return filePath;
}
