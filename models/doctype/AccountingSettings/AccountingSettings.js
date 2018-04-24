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

    ]
}