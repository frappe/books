import countryInfo from '~/fixtures/countryInfo.json';

const countryList = Object.keys(countryInfo).sort();
export default {
  name: 'AccountingSettings',
  label: 'Accounting Settings',
  naming: 'name', // {random|autoincrement}
  isSingle: 1,
  isChild: 0,
  isSubmittable: 0,
  settings: null,
  keywordFields: [],
  fields: [
    {
      label: 'Company Name',
      fieldname: 'companyName',
      fieldtype: 'Data',
      required: 1
    },

    {
      label: 'Write Off Account',
      fieldname: 'writeOffAccount',
      fieldtype: 'Link',
      target: 'Account',
      default: 'Write Off',
      getFilters() {
        return {
          isGroup: 0,
          rootType: 'Expense'
        };
      }
    },

    {
      label: 'Round Off Account',
      fieldname: 'roundOffAccount',
      fieldtype: 'Link',
      target: 'Account',
      default: 'Rounded Off',
      getFilters() {
        return {
          isGroup: 0,
          rootType: 'Expense'
        };
      }
    },

    {
      fieldname: 'country',
      label: 'Country',
      fieldtype: 'AutoComplete',
      placeholder: 'Select Country',
      required: 1,
      getList: () => countryList
    },

    {
      fieldname: 'currency',
      label: 'Currency',
      fieldtype: 'Data',
      required: 0
    },

    {
      fieldname: 'fullname',
      label: 'Name',
      fieldtype: 'Data',
      required: 1
    },

    {
      fieldname: 'email',
      label: 'Email',
      fieldtype: 'Data',
      required: 1,
      validate: {
        type: 'email'
      }
    },

    {
      fieldname: 'bankName',
      label: 'Bank Name',
      fieldtype: 'Data',
      required: 1
    },

    {
      fieldname: 'fiscalYearStart',
      label: 'Fiscal Year Start Date',
      fieldtype: 'Date',
      required: 1
    },

    {
      fieldname: 'fiscalYearEnd',
      label: 'Fiscal Year End Date',
      fieldtype: 'Date',
      required: 1
    },

    {
      fieldname: 'setupComplete',
      label: 'Setup Complete',
      fieldtype: 'Check',
      default: 0
    },

    {
      fieldname: 'autoUpdate',
      label: 'Auto Update',
      fieldtype: 'Check',
      default: 1
    }
  ],
  quickEditFields: [
    'fullname',
    'email',
    'companyName',
    'country',
    'currency',
    'fiscalYearStart',
    'fiscalYearEnd'
  ]
};
