module.exports = {
    "name": "Party",
    "doctype": "DocType",
    "isSingle": 0,
    "istable": 0,
    "keywordFields": [
        "name"
    ],
    "fields": [
        {
            "fieldname": "name",
            "label": "Name",
            "fieldtype": "Data",
            "required": 1
        },
        {
          fieldname: 'defaultAccount',
          label: 'Default Account',
          fieldtype: 'Link',
          target: 'Account',
          getFilters: (query, control) => {
            return {
              isGroup: 0,
              accountType: 'Receivable'
            };
          }
        },
        {
            "fieldname": "customer",
            "label": "Customer",
            "fieldtype": "Check"
        },
        {
            "fieldname": "supplier",
            "label": "Supplier",
            "fieldtype": "Check"
        }
    ],

    links: [
        {
            label: 'Invoices',
            condition: (form) => form.doc.customer,
            action: form => {
              form.$router.push({
                path: `/report/sales-register?&customer=${form.doc.name}`
              });
            }
        }
    ]
}
