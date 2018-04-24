const countryList = Object.keys(require('../fixtures/countryInfo.json')).sort();

module.exports = {
    fields: [

        {
            "fieldname": "file",
            "label": "File",
            "fieldtype": "File",
            "required": 1,
            "directory": 1
        },

        {
            "fieldname": "country",
            "label": "Country",
            "fieldtype": "Autocomplete",
            "required": 1,
            getList: () => countryList
        },

        {
            "fieldname": "name",
            "label": "Name",
            "fieldtype": "Data",
            "required": 1
        },

        {
            "fieldname": "email",
            "label": "Email",
            "fieldtype": "Data",
            "required": 1,
            "inputType": "email"
        },

        {
            "fieldname": "companyName",
            "label": "Company Name",
            "fieldtype": "Data",
            "required": 1
        },

        {
            "fieldname": "bankName",
            "label": "Bank Name",
            "fieldtype": "Data",
            "required": 1
        },

        {
            "fieldname": "fiscalYearStart",
            "label": "Fiscal Year Start Date",
            "fieldtype": "Date",
            "required": 1
        },

        {
            "fieldname": "fiscalYearEnd",
            "label": "Fiscal Year End Date",
            "fieldtype": "Date",
            "required": 1
        },
    ],

    layout: [
        {
            title: 'Select File location',
            fields: ['file']
        },

        {
            title: 'Select Country',
            fields: ['country']
        },

        {
            title: 'Add a Profile',
            fields: ['name', 'email']
        },

        {
            title: 'Add your Company',
            fields: ['companyName', 'bankName', 'fiscalYearStart', 'fiscalYearEnd']
        }
    ]
}
