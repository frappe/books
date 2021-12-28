import { DateTime } from 'luxon';
import { generateGstr1Json } from '../../accounting/gst';

const transferTypeMap = {
  B2B: 'B2B',
  B2CL: 'B2C-Large',
  B2CS: 'B2C-Small',
  NR: 'Nil Rated, Exempted and Non GST supplies',
};

export default {
  filterFields: [
    {
      fieldtype: 'Select',
      label: 'Transfer Type',
      placeholder: 'Transfer Type',
      fieldname: 'transferType',
      options: Object.keys(transferTypeMap),
      map: transferTypeMap,
      default: 'B2B',
      size: 'small',
    },
    {
      fieldtype: 'Data',
      label: 'Place',
      size: 'small',
      placeholder: 'Place',
      fieldname: 'place',
    },
    {
      fieldtype: 'Date',
      label: 'From Date',
      size: 'small',
      placeholder: 'From Date',
      fieldname: 'fromDate',
      default: () => DateTime.local().minus({ months: 3 }).toISODate(),
    },
    {
      fieldtype: 'Date',
      label: 'To Date',
      size: 'small',
      placeholder: 'To Date',
      fieldname: 'toDate',
      default: () => DateTime.local().toISODate(),
    },
  ],
  actions: [
    {
      group: 'Export',
      label: 'JSON',
      type: 'primary',
      action: async (report, filters) => {
        generateGstr1Json(report, filters);
      },
    },
  ],

  getColumns() {
    return [
      {
        label: 'GSTIN No.',
        fieldname: 'gstin',
        fieldtype: 'Data',
        width: 1.5,
      },
      {
        label: 'Party',
        fieldtype: 'Data',
        fieldname: 'partyName',
        width: 1.5,
      },
      {
        label: 'Invoice No.',
        fieldname: 'invNo',
        fieldtype: 'Data',
      },
      {
        label: 'Invoice Value',
        fieldname: 'invAmt',
        fieldtype: 'Currency',
      },
      {
        label: 'Invoice Date',
        fieldname: 'invDate',
        fieldtype: 'Date',
      },
      {
        label: 'Place of supply',
        fieldname: 'place',
        fieldtype: 'Data',
      },
      {
        label: 'Rate',
        fieldname: 'rate',
        fieldtype: 'Data',
        width: 0.5,
      },
      {
        label: 'Taxable Value',
        fieldname: 'taxVal',
        fieldtype: 'Currency',
      },
      {
        label: 'Reverse Chrg.',
        fieldname: 'reverseCharge',
        fieldtype: 'Data',
      },
      {
        label: 'Intergrated Tax',
        fieldname: 'igstAmt',
        fieldtype: 'Currency',
      },
      {
        label: 'Central Tax',
        fieldname: 'cgstAmt',
        fieldtype: 'Currency',
      },
      {
        label: 'State Tax',
        fieldname: 'sgstAmt',
        fieldtype: 'Currency',
      },
    ];
  },
};
