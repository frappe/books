const title = 'Bank Reconciliation';
import { t } from 'fyo';
import ImportWizard from '../../src/components/ImportWizart';
import BankReconciliationImport from './BankReconciliationImport';

export default {
  title: title,
  method: 'bank-reconciliation',
  filterFields: [
    {
      fieldtype: 'Link',
      target: 'Account',
      size: 'small',
      placeholder: t`Payment Account`,
      label: t`Payment Account`,
      fieldname: 'paymentAccount',
      getFilters: () => {
        return {
          accountType: 'Bank',
          isGroup: 0,
        };
      },
    },
    {
      fieldtype: 'Link',
      target: 'Party',
      size: 'small',
      label: t`Party`,
      placeholder: t`Party`,
      fieldname: 'party',
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: t`From Date`,
      label: t`From Date`,
      fieldname: 'fromDate',
    },
    {
      fieldtype: 'Date',
      size: 'small',
      placeholder: t`To Date`,
      label: t`To Date`,
      fieldname: 'toDate',
    },
  ],
  actions: [
    {
      label: t`Reconcile`,
      type: 'secondary',
      condition: (report) => report.currentFilters.paymentAccount,
      action: async (report) => {
        report.$modal.show({
          modalProps: {
            title: `Import Bank Account Statement`,
            noFooter: true,
          },
          component: ImportWizard,
          props: {
            importHandler: BankReconciliationImport.fileImportHandler,
            report,
          },
        });
      },
    },
  ],
  getColumns() {
    return [
      {
        label: t`Posting Date`,
        fieldtype: 'Date',
        fieldname: 'date',
      },
      {
        label: t`Payment Account`,
        fieldtype: 'Link',
      },
      {
        label: t`Debit`,
        fieldtype: 'Currency',
      },
      {
        label: t`Credit`,
        fieldtype: 'Currency',
      },
      {
        label: t`Balance`,
        fieldtype: 'Currency',
      },
      {
        label: t`Ref/Cheque ID`,
        fieldtype: 'Data',
        fieldname: 'referenceId',
      },
      {
        label: t`Clearance Date`,
        fieldtype: 'Date',
        fieldname: 'clearanceDate',
      },
      {
        label: t`Ref. Type`,
        fieldtype: 'Data',
        fieldname: 'referenceType',
      },
      {
        label: t`Ref. Name`,
        fieldtype: 'Data',
        fieldname: 'referenceName',
      },
      {
        label: t`Ref. Date`,
        fieldtype: 'Date',
        fieldname: 'referenceDate',
      },

      {
        label: t`Party`,
        fieldtype: 'Link',
      },
    ];
  },
};
