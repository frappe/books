const countryList = require('../../../fixtures/countryInfo.json');

module.exports = {
    name: "SetupWizard",
    label: "Setup Wizard",
    naming: "name",
    isSingle: 1,
    isChild: 0,
    isSubmittable: 0,
    settings: null,
    keywordFields: [],
    fields: [{
            fieldname: 'country',
            label: 'Country',
            fieldtype: 'Autocomplete',
            required: 1,
            getList: () => Object.keys(countryList).sort()
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
            inputType: 'email'
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
            formula: (doc) => {
                let date = countryList[doc.country]["fiscal_year_start"].split("-");
                var currentYear = (new Date).getFullYear();
                let currentMonth = date[0] - 1 ;
                let currentDate = date[1];
                return new Date(currentYear,currentMonth,currentDate).toISOString().substr(0, 10);;
            },
            default: "None",
            required: 1
        },

        {
            fieldname: 'fiscalYearEnd',
            label: 'Fiscal Year End Date',
            fieldtype: 'Date',
            formula: (doc) => {
                let date = countryList[doc.country]["fiscal_year_end"].split("-");
                var currentYear = (new Date).getFullYear() + 1 ;
                let currentMonth = date[0] - 1 ;
                let currentDate = date[1];
                return new Date(currentYear,currentMonth,currentDate).toISOString().substr(0, 10);;
            },
            default: "None",
            required: 1
        }
    ],

    layout: {
        paginated: true,
        sections: [{
                title: 'Select Country',
                columns: [{
                    fields: ['country']
                }]
            },

            {
                title: 'Add a Profile',
                columns: [{
                    fields: ['fullname', 'email']
                }]
            },

            {
                title: 'Add your Company',
                columns: [{
                    fields: ['companyName', 'bankName', 'fiscalYearStart', 'fiscalYearEnd']
                }]
            }
        ].filter(Boolean)
    }
}
