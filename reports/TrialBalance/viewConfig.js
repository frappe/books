import frappe from 'frappe';
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
      label: 'From Date',
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
      label: 'To Date',
      required: 1,
      default: async () => {
        return (await frappe.getSingle('AccountingSettings')).fiscalYearEnd;
      },
    },
  ],
  actions: getCommonExportActions('trial-balance'),
  getColumns() {
    const columns = [
      { label: 'Account', fieldtype: 'Data', fieldname: 'account', width: 2 },
      {
        label: 'Opening (Dr)',
        fieldtype: 'Currency',
        fieldname: 'openingDebit',
      },
      {
        label: 'Opening (Cr)',
        fieldtype: 'Currency',
        fieldname: 'openingCredit',
      },
      { label: 'Debit', fieldtype: 'Currency', fieldname: 'debit' },
      { label: 'Credit', fieldtype: 'Currency', fieldname: 'credit' },
      {
        label: 'Closing (Dr)',
        fieldtype: 'Currency',
        fieldname: 'closingDebit',
      },
      {
        label: 'Closing (Cr)',
        fieldtype: 'Currency',
        fieldname: 'closingCredit',
      },
    ];

    return columns;
  },
};
