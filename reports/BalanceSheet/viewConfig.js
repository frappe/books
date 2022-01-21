import frappe from 'frappe';
import getCommonExportActions from '../commonExporter';

export default {
  title: 'Balance Sheet',
  method: 'balance-sheet',
  filterFields: [
    {
      fieldtype: 'Date',
      fieldname: 'toDate',
      size: 'small',
      placeholder: 'ToDate',
      label: 'To Date',
      required: 1,
      default: async () => {
        return (await frappe.getSingle('AccountingSettings')).fiscalYearEnd;
      },
    },
    {
      fieldtype: 'Select',
      placeholder: 'Select Period',
      size: 'small',
      options: ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'],
      label: 'Periodicity',
      fieldname: 'periodicity',
      default: 'Monthly',
    },
  ],
  actions: getCommonExportActions('balance-sheet'),
  getColumns({ data }) {
    const columns = [
      { label: 'Account', fieldtype: 'Data', fieldname: 'account', width: 2 },
    ];

    if (data && data.columns) {
      const currencyColumns = data.columns;
      const columnDefs = currencyColumns.map((name) => ({
        label: name,
        fieldname: name,
        fieldtype: 'Currency',
      }));

      columns.push(...columnDefs);
    }

    return columns;
  },
};
