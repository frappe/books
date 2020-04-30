const { DateTime } = require('luxon');
const countryList = require('~/fixtures/countryInfo.json');

module.exports = {
  name: 'SetupWizard',
  label: 'Setup Wizard',
  naming: 'name',
  isSingle: 1,
  isChild: 0,
  isSubmittable: 0,
  settings: null,
  keywordFields: [],
  fields: [
    {
      fieldname: 'companyLogo',
      label: 'Company Logo',
      fieldtype: 'AttachImage'
    },
    {
      fieldname: 'country',
      label: 'Country',
      fieldtype: 'AutoComplete',
      placeholder: 'Select Country',
      required: 1,
      getList: () => Object.keys(countryList).sort()
    },

    {
      fieldname: 'fullname',
      label: 'Your Name',
      fieldtype: 'Data',
      placeholder: 'John Doe',
      required: 1
    },

    {
      fieldname: 'email',
      label: 'Email',
      fieldtype: 'Data',
      placeholder: 'john@doe.com',
      required: 1,
      validate: {
        type: 'email'
      }
    },

    {
      fieldname: 'companyName',
      label: 'Company Name',
      placeholder: 'Company Name',
      fieldtype: 'Data',
      required: 1
    },

    {
      fieldname: 'bankName',
      label: 'Bank Name',
      fieldtype: 'Data',
      placeholder: 'Prime Bank',
      required: 1
    },

    {
      fieldname: 'fiscalYearStart',
      label: 'Fiscal Year Start Date',
      placeholder: 'Fiscal Year Start Date',
      fieldtype: 'Date',
      formula: doc => {
        if (!doc.country) return;
        let today = DateTime.local();
        let fyStart = countryList[doc.country].fiscal_year_start;
        if (fyStart) {
          return DateTime.fromFormat(fyStart, 'MM-dd')
            .plus({ year: [1, 2, 3].includes(today.month) ? -1 : 0 })
            .toISODate();
        }
      },
      required: 1
    },

    {
      fieldname: 'fiscalYearEnd',
      label: 'Fiscal Year End Date',
      placeholder: 'Fiscal Year End Date',
      fieldtype: 'Date',
      formula: doc => {
        if (!doc.country) return;
        let today = DateTime.local();
        let fyEnd = countryList[doc.country].fiscal_year_end;
        if (fyEnd) {
          return DateTime.fromFormat(fyEnd, 'MM-dd')
            .plus({ year: [1, 2, 3].includes(today.month) ? 0 : 1 })
            .toISODate();
        }
      },
      required: 1
    },
    {
      fieldname: 'currency',
      label: 'Currency',
      fieldtype: 'Data',
      placeholder: 'INR',
      formula: doc => {
        if (!doc.country) return;
        return countryList[doc.country].currency;
      },
      required: 1
    },
    {
      fieldname: 'completed',
      label: 'Completed',
      fieldtype: 'Check',
      readonly: 1
    }
  ],
  quickEditFields: [
    'fullname',
    'bankName',
    'country',
    'currency',
    'fiscalYearStart',
    'fiscalYearEnd'
  ]
};
