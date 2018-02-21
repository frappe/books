module.exports = {
    name: "SystemSettings",
    label: "System Settings",
    doctype: "DocType",
    isSingle: 1,
    isChild: 0,
    keywordFields: [],
    fields: [
        {
            fieldname: "dateFormat",
            label: "Date Format",
            fieldtype: "Select",
            options: [
                "dd/mm/yyyy",
                "mm/dd/yyyy",
                "dd-mm-yyyy",
                "mm-dd-yyyy",
                "yyyy-mm-dd"
            ],
            default: "yyyy-mm-dd",
            required: 1
        }
    ]
}