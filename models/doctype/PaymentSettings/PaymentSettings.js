export default {
    name: "PaymentSettings",
    label: "Payment Settings",
    isSingle: 1,
    isChild: 0,
    keywordFields: [],
    "fields": [
        {
            "fieldname": "numberSeries",
            "label": "Number Series",
            "fieldtype": "Link",
            "target": "NumberSeries",
            "required": 1,
            "default": "PAY"
        }
    ]
};