import { t } from 'frappe';
export default {
  name: 'GetStarted',
  isSingle: 1,
  fields: [
    {
      fieldname: 'onboardingComplete',
      label: t`Onboarding Complete`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'companySetup',
      label: t`Company Setup`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'systemSetup',
      label: t`System Setup`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'invoiceSetup',
      label: t`Invoice Setup`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'itemCreated',
      label: t`Item Created`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'customerCreated',
      label: t`Customer Created`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'supplierCreated',
      label: t`Supplier Created`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'invoiceCreated',
      label: t`Invoice Created`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'billCreated',
      label: t`Bill Created`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'chartOfAccountsReviewed',
      label: t`Chart Of Accounts Reviewed`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'openingBalanceChecked',
      label: t`Opening Balances`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'taxesAdded',
      label: t`Add Taxes`,
      fieldtype: 'Check',
    },
  ],
};
