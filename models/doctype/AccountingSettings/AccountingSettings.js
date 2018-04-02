const countryList = Object.keys(require('../../../fixtures/countryInfo.json')).sort();

module.exports = {
    name: "AccountingSettings",
    label: "AccountingSettings",
    naming: "name", // {random|autoincrement}
    isSingle: 1,
    isChild: 0,
    isSubmittable: 0,
    settings: null,
    keywordFields: [],
    fields: [
        {
            label: "Company Name",
            fieldname: "companyName",
            fieldtype: "Data",
            required: 1
        },

        {
            label: "Writeoff Account",
            fieldname: "writeOffAccount",
            fieldtype: "Account"
        },

        {
            "fieldname": "file",
            "label": "File",
            "fieldtype": "Data",
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
            "fieldname": "fullname",
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

    ]
}