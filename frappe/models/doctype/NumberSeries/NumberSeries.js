module.exports = {
    "name": "NumberSeries",
    "documentClass": require('./NumberSeriesDocument.js'),
    "doctype": "DocType",
    "isSingle": 0,
    "isChild": 0,
    "keywordFields": [],
    "fields": [
        {
            "fieldname": "name",
            "label": "Prefix",
            "fieldtype": "Data",
            "required": 1
        },
        {
            "fieldname": "current",
            "label": "Current",
            "fieldtype": "Int",
            "required": 1
        }
    ]
}