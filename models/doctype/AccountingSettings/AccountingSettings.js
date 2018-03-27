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
            fieldname: "Company Name",
            label: "companyName",
            fieldtype: "Data",
            required: 1
        },
        {
            fieldname: "Writeoff Account",
            label: "writeOffAccount",
            fieldtype: "Account"
        }

    ]
}