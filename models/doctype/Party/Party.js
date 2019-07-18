module.exports = {
  name: 'Party',
  doctype: 'DocType',
  documentClass: require('./PartyDocument.js'),
  isSingle: 0,
  istable: 0,
  keywordFields: ['name'],
  fields: [
    {
      fieldname: 'name',
      label: 'Name',
      fieldtype: 'Data',
      required: 1
    },
    {
      fieldname: 'address',
      label: 'Address',
      fieldtype: 'Link',
      target: 'Address'
    },
    {
      fieldname: 'defaultAccount',
      label: 'Default Account',
      fieldtype: 'Link',
      target: 'Account',
      getFilters: (query, doc) => {
        return {
          isGroup: 0,
          accountType: doc.customer === 1 ? 'Receivable' : 'Payable'
        };
      }
    },
    {
      fieldname: 'customer',
      label: 'Customer',
      fieldtype: 'Check'
    },
    {
      fieldname: 'supplier',
      label: 'Supplier',
      fieldtype: 'Check'
    }
  ],

  links: [
    {
      label: 'Invoices',
      condition: form => form.doc.customer,
      action: form => {
        form.$router.push({
          path: `/report/sales-register?&customer=${form.doc.name}`
        });
      }
    },
    {
      label: 'Delete',
      condition: form => form.doc.customer,
      action: async form => {
        const party = await frappe.getDoc('Party', form.doc.name);
        await party.delete();
        form.$router.push({
          path: `/list/Customer`
        });
      }
    }
  ]
};
