let { _ } = require('frappejs/utils');

module.exports = {
  name: 'Party',
  label: 'Party',
  doctype: 'DocType',
  isSingle: 0,
  keywordFields: ['name'],
  fields: [
    {
      fieldname: 'name',
      label: 'Name',
      fieldtype: 'Data',
      required: 1,
      placeholder: 'Full Name'
    },
    {
      fieldname: 'image',
      label: 'Image',
      fieldtype: 'AttachImage',
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
    },
    {
      fieldname: 'defaultAccount',
      label: 'Default Account',
      fieldtype: 'Link',
      target: 'Account',
      getFilters: (query, doc) => {
        return {
          isGroup: 0,
          accountType: doc.customer ? 'Receivable' : 'Payable'
        };
      }
    },
    {
      fieldname: 'outstandingAmount',
      label: 'Outstanding Amount',
      fieldtype: 'Currency'
    },
    {
      fieldname: 'currency',
      label: 'Currency',
      fieldtype: 'Link',
      target: 'Currency',
      placeholder: 'INR'
    },
    {
      fieldname: 'email',
      label: 'Email',
      fieldtype: 'Data',
      placeholder: 'john@doe.com'
    },
    {
      fieldname: 'phone',
      label: 'Phone',
      fieldtype: 'Data',
      placeholder: 'Phone'
    },
    {
      fieldname: 'address',
      label: 'Address',
      fieldtype: 'Link',
      target: 'Address',
      placeholder: _('Click to create'),
      inline: true
    },
    {
      fieldname: 'addressDisplay',
      label: 'Address Display',
      fieldtype: 'Text',
      readOnly: true,
      formula: doc => {
        if (doc.address) {
          return doc.getFrom('Address', doc.address, 'addressDisplay');
        }
      }
    }
  ],

  quickEditFields: ['defaultAccount', 'currency', 'email', 'phone', 'address'],

  getFormTitle(doc) {
    if (doc.customer) return 'Customer';
    return 'Supplier';
  },

  getListTitle(doc) {
    if (doc.customer) return 'Customer';
    return 'Supplier';
  },

  links: [
    {
      label: 'New Sales Invoice',
      condition: form => form.doc.customer,
      action: async form => {
        const invoice = await frappe.getNewDoc('SalesInvoice');
        invoice.customer = form.doc.name;
        invoice.account = form.doc.defaultAccount;
        invoice.on('afterInsert', async () => {
          form.$formModal.close();
          form.$router.push({
            path: `/edit/SalesInvoice/${invoice.name}`
          });
        });
        await form.$formModal.open(invoice);
      }
    },
    {
      label: 'Sales Invoices',
      condition: form => form.doc.customer,
      action: form => {
        form.$router.push({
          path: `/list/SalesInvoice?customer=${form.doc.name}`
        });
      }
    },
    {
      label: 'New Purchase Invoice',
      condition: form => form.doc.supplier,
      action: async form => {
        const invoice = await frappe.getNewDoc('PurchaseInvoice');
        invoice.supplier = form.doc.name;
        invoice.account = form.doc.defaultAccount;
        invoice.on('afterInsert', async () => {
          form.$formModal.close();
          form.$router.push({
            path: `/edit/PurchaseInvoice/${invoice.name}`
          });
        });
        await form.$formModal.open(invoice);
      }
    },
    {
      label: 'Purchase Invoices',
      condition: form => form.doc.supplier,
      action: form => {
        form.$router.push({
          path: `/list/PurchaseInvoice?supplier=${form.doc.name}`
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
