import frappe, { t } from 'frappe';
import getCommonExportActions from '../commonExporter';

const title = t`Profit and Loss`;

const periodicityMap = {
  Monthly: t`Monthly`,
  Quarterly: t`Quarterly`,
  'Half Yearly': t`Half Yearly`,
  Yearly: t`Yearly`,
};
export default {
  title: title,
  method: 'profit-and-loss',
  treeView: true,
  filterFields: [
    {
      fieldtype: 'Date',
      fieldname: 'fromDate',
      size: 'small',
      placeholder: t`From Date`,
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
      placeholder: t`To Date`,
      label: t`To Date`,
      required: 1,
      default: async () => {
        return (await frappe.getSingle('AccountingSettings')).fiscalYearEnd;
      },
    },
    {
      fieldtype: 'Select',
      size: 'small',
      options: Object.keys(periodicityMap),
      map: periodicityMap,
      default: 'Monthly',
      label: t`Periodicity`,
      placeholder: t`Select Period...`,
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
