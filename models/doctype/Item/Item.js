const frappe = require('frappejs');
const { _ } = require('frappejs/utils');

module.exports = {
  name: 'Item',
  doctype: 'DocType',
  isSingle: 0,
  keywordFields: ['name', 'description'],
  fields: [
    {
      fieldname: 'name',
      label: 'Item Name',
      fieldtype: 'Data',
      placeholder: 'Item Name',
      required: 1
    },
    {
      fieldname: 'image',
      label: 'Image',
      fieldtype: 'AttachImage'
    },
    {
      fieldname: 'description',
      label: 'Description',
      placeholder: 'Item Description',
      fieldtype: 'Text'
    },
    {
      fieldname: 'unit',
      label: 'Unit Type',
      fieldtype: 'Select',
      default: 'Unit',
      options: ['Unit', 'Kg', 'Gram', 'Hour', 'Day']
    },
    {
      fieldname: 'itemType',
      label: 'Type',
      placeholder: 'Sales',
      fieldtype: 'Select',
      default: 'Product',
      options: ['Product', 'Service']
    },
    {
      fieldname: 'incomeAccount',
      label: 'Income',
      fieldtype: 'Link',
      target: 'Account',
      placeholder: 'Sales',
      required: 1,
      disableCreation: true,
      getFilters: () => {
        return {
          isGroup: 0,
          accountType: 'Income Account'
        };
      },
      formulaDependsOn: ['itemType'],
      formula(doc) {
        if (doc.itemType === 'Product') {
          return 'Sales';
        }
        if (doc.itemType === 'Service') {
          return 'Service';
        }
      }
    },
    {
      fieldname: 'expenseAccount',
      label: 'Expense',
      fieldtype: 'Link',
      target: 'Account',
      placeholder: 'Select Account',
      required: 1,
      disableCreation: true,
      getFilters: () => {
        return {
          isGroup: 0,
          accountType: ['in', ['Cost of Goods Sold', 'Expense Account']]
        };
      },
      formulaDependsOn: ['itemType'],
      formula() {
        return 'Cost of Goods Sold';
      }
    },
    {
      fieldname: 'tax',
      label: 'Tax',
      fieldtype: 'Link',
      target: 'Tax',
      placeholder: 'GST'
    },
    {
      fieldname: 'rate',
      label: 'Rate',
      fieldtype: 'Currency',
      placeholder: '0.00',
      validate(value) {
        if (!value) {
          throw new frappe.errors.ValidationError(
            'Rate must be greater than 0'
          );
        }
      }
    }
  ],
  quickEditFields: ['rate', 'unit', 'itemType', 'tax', 'description'],
  actions: [
    {
      label: _('New Invoice'),
      condition: doc => !doc.isNew(),
      action: async (doc, router) => {
        const invoice = await frappe.getNewDoc('SalesInvoice');
        invoice.append('items', {
          item: doc.name,
          rate: doc.rate,
          tax: doc.tax
        });
        router.push(`/edit/SalesInvoice/${invoice.name}`);
      }
    },
    {
      label: _('New Bill'),
      condition: doc => !doc.isNew(),
      action: async (doc, router) => {
        const invoice = await frappe.getNewDoc('PurchaseInvoice');
        invoice.append('items', {
          item: doc.name,
          rate: doc.rate,
          tax: doc.tax
        });
        router.push(`/edit/PurchaseInvoice/${invoice.name}`);
      }
    }
  ]
};
