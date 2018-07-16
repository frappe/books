import { _ } from 'frappejs/utils';
import countryInfo from '../../../fixtures/countryInfo.json';

const countryList = Object.keys(countryInfo).sort();

export default {
  fields: [
    {
      fieldname: 'file',
      label: _('Folder Location'),
      fieldtype: 'File',
      placeholder: _('Select Folder'),
      required: 1,
      directory: 1
    },

    {
      fieldname: 'country',
      label: 'Country',
      fieldtype: 'Autocomplete',
      required: 1,
      getList: () => countryList
    },

    {
      fieldname: 'companyName',
      label: 'Company Name',
      fieldtype: 'Data',
      required: 1
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
    }
  ],

  layout: {
    paginated: true,
    sections: [
      {
        title: 'Select File location',
        columns: [
          { fields: ['file'] }
        ]
      },

      {
        title: 'Select Country',
        columns: [
          { fields: ['country'] }
        ]
      },

      {
        title: 'Add your Company',
        columns: [
          { fields: ['companyName', 'bankName', 'fiscalYearStart', 'fiscalYearEnd'] }
        ]
      }
    ]
  }
}
