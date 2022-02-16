import frappe, { t } from 'frappe';
import getCommonExportActions from '../commonExporter';

const title = 'Trial Balance';

export default {
  title: title,
  method: 'trial-balance',
  treeView: true,
  filterFields: [
    {
      fieldtype: 'Date',
      fieldname: 'fromDate',
      label: t`From Date`,
      size: 'small',
      placeholder: 'From Date',
      required: 1,
      default: async () => {
        return (await frappe.getSingle('AccountingSettings')).fiscalYearStart;
      },
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: 'To Date',
      fieldname: 'toDate',
      label: t`To Date`,
      required: 1,
      default: async () => {
        return (await frappe.getSingle('AccountingSettings')).fiscalYearEnd;
      },
    },
  ],
  actions: getCommonExportActions('trial-balance'),
  getColumns() {
    const columns = [
      { label: t`Account`, fieldtype: 'Data', fieldname: 'account', width: 2 },
      {
        label: t`Opening (Dr)`,
        fieldtype: 'Currency',
        fieldname: 'openingDebit',
      },
      {
        label: t`Opening (Cr)`,
        fieldtype: 'Currency',
        fieldname: 'openingCredit',
      },
      { label: t`Debit`, fieldtype: 'Currency', fieldname: 'debit' },
      { label: t`Credit`, fieldtype: 'Currency', fieldname: 'credit' },
      {
        label: t`Closing (Dr)`,
        fieldtype: 'Currency',
        fieldname: 'closingDebit',
      },
      {
        label: t`Closing (Cr)`,
        fieldtype: 'Currency',
        fieldname: 'closingCredit',
      },
    ];

    return columns;
  },
};
