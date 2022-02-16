import { t } from 'frappe';
import { DateTime } from 'luxon';
import { stateCodeMap } from '../../accounting/gst';
import { titleCase } from '../../src/utils';

const stateList = Object.keys(stateCodeMap).map(titleCase).sort();

export default {
  filterFields: [
    {
      fieldtype: 'AutoComplete',
      label: t`Place`,
      size: 'small',
      placeholder: 'Place',
      fieldname: 'place',
      getList: () => stateList,
    },
    {
      fieldtype: 'Date',
      label: t`From Date`,
      size: 'small',
      placeholder: 'From Date',
      fieldname: 'fromDate',
      default: () => DateTime.local().minus({ months: 3 }).toISODate(),
    },
    {
      fieldtype: 'Date',
      label: t`To Date`,
      size: 'small',
      placeholder: 'To Date',
      fieldname: 'toDate',
      default: () => DateTime.local().toISODate(),
    },
  ],
  getColumns({ filters }) {
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
        fieldtype: 'Data',
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
    ];

    const transferType = filters.transferType || 'B2B';
    if (transferType === 'B2B') {
      columns.unshift({
        label: t`GSTIN No.`,
        fieldname: 'gstin',
        fieldtype: 'Data',
        width: 1.5,
      });
    }

    return columns;
  },
};
