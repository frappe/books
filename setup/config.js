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
            "required": 1
        },

        {
            "fieldname": "companyName",
            "label": "Company Name",
            "fieldtype": "Data",
            "required": 1
        },

        {
            "fieldname": "abbreviation",
            "label": "Abbreviation",
            "fieldtype": "Data",
            "required": 1
        },

        {
            "fieldname": "bankName",
            "label": "Bank Name",
            "fieldtype": "Data",
            "required": 1
        }
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
            columns: [
                {
                    fields: ['companyName', 'bankName']
                },
                {
                    fields: ['abbreviation']
                },
            ]
        }
    ]
}
