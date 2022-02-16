import frappe, { t } from 'frappe';
import getCommonExportActions from '../commonExporter';

const title = 'Profit and Loss';

export default {
  title: title,
  method: 'profit-and-loss',
  treeView: true,
  filterFields: [
    {
      fieldtype: 'Date',
      fieldname: 'fromDate',
      size: 'small',
      placeholder: 'From Date',
      label: t`From Date`,
      required: 1,
      default: async () => {
        return (await frappe.getSingle('AccountingSettings')).fiscalYearStart;
      },
    },
    {
      fieldtype: 'Date',
      fieldname: 'toDate',
      size: 'small',
      placeholder: 'To Date',
      label: t`To Date`,
      required: 1,
      default: async () => {
        return (await frappe.getSingle('AccountingSettings')).fiscalYearEnd;
      },
    },
    {
      fieldtype: 'Select',
      size: 'small',
      options: ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'],
      default: 'Monthly',
      label: t`Periodicity`,
      placeholder: 'Select Period...',
      fieldname: 'periodicity',
    },
  ],
  actions: getCommonExportActions('profit-and-loss'),
  getColumns({ data }) {
    const columns = [
      { label: t`Account`, fieldtype: 'Data', fieldname: 'account', width: 2 },
    ];

    if (data && data.columns) {
      const currencyColumns = data.columns;
      const columnDefs = currencyColumns.map((name) => ({
        label: name,
        fieldname: name,
        fieldtype: 'Currency',
        width: 1,
      }));

      columns.push(...columnDefs);
    }

    return columns;
  },
};
