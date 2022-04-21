import { t } from 'fyo';
import getCommonExportActions from '../commonExporter';
import { fyo } from 'src/initFyo';

const periodicityMap = {
  Monthly: t`Monthly`,
  Quarterly: t`Quarterly`,
  'Half Yearly': t`Half Yearly`,
  Yearly: t`Yearly`,
};
export default {
  title: t`Balance Sheet`,
  method: 'balance-sheet',
  filterFields: [
    {
      fieldtype: 'Date',
      fieldname: 'toDate',
      size: 'small',
      placeholder: t`To Date`,
      label: t`To Date`,
      required: 1,
      default: async () => {
        return (await fyo.doc.getSingle('AccountingSettings')).fiscalYearEnd;
      },
    },
    {
      fieldtype: 'Select',
      placeholder: t`Select Period`,
      size: 'small',
      options: Object.keys(periodicityMap),
      map: periodicityMap,
      label: t`Periodicity`,
      fieldname: 'periodicity',
      default: 'Monthly',
    },
  ],
  actions: getCommonExportActions('balance-sheet'),
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
      }));

      columns.push(...columnDefs);
    }

    return columns;
  },
};
