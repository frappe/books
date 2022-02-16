import { t } from 'frappe';
import countryInfo from '~/fixtures/countryInfo.json';

const countryList = Object.keys(countryInfo).sort();
export default {
  name: 'AccountingSettings',
  label: t`Accounting Settings`,
  naming: 'name', // {random|autoincrement}
  isSingle: 1,
  isChild: 0,
  isSubmittable: 0,
  settings: null,
  keywordFields: [],
  fields: [
    {
      label: t`Company Name`,
      fieldname: 'companyName',
      fieldtype: 'Data',
      required: 1,
    },

    {
      label: t`Write Off Account`,
      fieldname: 'writeOffAccount',
      fieldtype: 'Link',
      target: 'Account',
      default: 'Write Off',
      getFilters() {
        return {
          isGroup: 0,
          rootType: 'Expense',
        };
      },
    },

    {
      label: t`Round Off Account`,
      fieldname: 'roundOffAccount',
      fieldtype: 'Link',
      target: 'Account',
      default: 'Rounded Off',
      getFilters() {
        return {
          isGroup: 0,
          rootType: 'Expense',
        };
      },
    },

    {
      fieldname: 'country',
      label: t`Country`,
      fieldtype: 'AutoComplete',
      placeholder: 'Select Country',
      readOnly: 1,
      required: 1,
      getList: () => countryList,
    },

    {
      fieldname: 'currency',
      label: t`Currency`,
      fieldtype: 'Data',
      readOnly: 1,
      required: 0,
    },

    {
      fieldname: 'fullname',
      label: t`Name`,
      fieldtype: 'Data',
      required: 1,
    },

    {
      fieldname: 'email',
      label: t`Email`,
      fieldtype: 'Data',
      required: 1,
      validate: {
        type: 'email',
      },
    },

    {
      fieldname: 'bankName',
      label: t`Bank Name`,
      fieldtype: 'Data',
      required: 1,
    },

    {
      fieldname: 'fiscalYearStart',
      label: t`Fiscal Year Start Date`,
      fieldtype: 'Date',
      required: 1,
    },

    {
      fieldname: 'fiscalYearEnd',
      label: t`Fiscal Year End Date`,
      fieldtype: 'Date',
      required: 1,
    },

    {
      fieldname: 'setupComplete',
      label: t`Setup Complete`,
      fieldtype: 'Check',
      default: 0,
    },
    {
      fieldname: 'gstin',
      label: t`GSTIN`,
      fieldtype: 'Data',
      placeholder: '27AAAAA0000A1Z5',
    },
  ],
  quickEditFields: [
    'fullname',
    'email',
    'companyName',
    'country',
    'currency',
    'fiscalYearStart',
    'fiscalYearEnd',
    'gstin',
  ],
};
