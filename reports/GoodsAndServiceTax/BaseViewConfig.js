import { generateGstr1Json } from '../../accounting/gst';
import { DateTime } from 'luxon';

export default {
  filterFields: [
    {
      fieldtype: 'Select',
      label: 'Transfer Type',
      placeholder: 'Transfer Type',
      fieldname: 'transferType',
      options: [
        'B2B',
        'B2C-Large',
        'B2C-Small',
        'Nil Rated, Exempted and Non GST supplies',
      ],
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
  linkFields: [
    {
      label: 'Export as JSON',
      type: 'secondary',
      action: async (report, filters) => {
        generateGstr1Json(report, filters);
      },
    },
    {
      label: 'Clear Filters',
      type: 'secondary',
      action: async report => {
        await report.getReportData({});
        report.usedToReRender += 1;
      }
    }
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
