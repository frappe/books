import frappe, { t } from 'frappe';

const itemForMap = {
  purchases: t`Purchases`,
  sales: t`Sales`,
  both: t`Both`,
};

export default {
  name: 'Item',
  label: t`Item`,
  doctype: 'DocType',
  isSingle: 0,
  regional: 1,
  keywordFields: ['name', 'description'],
  fields: [
    {
      fieldname: 'name',
      label: t`Item Name`,
      fieldtype: 'Data',
      placeholder: t`Item Name`,
      required: 1,
    },
    {
      fieldname: 'image',
      label: t`Image`,
      fieldtype: 'AttachImage',
    },
    {
      fieldname: 'description',
      label: t`Description`,
      placeholder: t`Item Description`,
      fieldtype: 'Text',
    },
    {
      fieldname: 'unit',
      label: t`Unit Type`,
      fieldtype: 'Select',
      placeholder: t`Unit Type`,
      default: 'Unit',
      options: ['Unit', 'Kg', 'Gram', 'Hour', 'Day'],
    },
    {
      fieldname: 'itemType',
      label: t`Type`,
      placeholder: t`Type`,
      fieldtype: 'Select',
      default: 'Product',
      options: ['Product', 'Service'],
    },
    {
      fieldname: 'for',
      label: t`For`,
      fieldtype: 'Select',
      options: Object.keys(itemForMap),
      map: itemForMap,
      default: 'both',
    },
    {
      fieldname: 'incomeAccount',
      label: t`Income`,
      fieldtype: 'Link',
      target: 'Account',
      placeholder: t`Income`,
      required: 1,
      disableCreation: true,
      getFilters: () => {
        return {
          isGroup: 0,
          rootType: 'Income',
        };
      },
      formulaDependsOn: ['itemType'],
      async formula(doc) {
        let accountName = 'Service';
        if (doc.itemType === 'Product') {
          accountName = 'Sales';
        }

        const accountExists = await frappe.db.exists('Account', accountName);
        return accountExists ? accountName : '';
      },
    },
    {
      fieldname: 'expenseAccount',
      label: t`Expense`,
      fieldtype: 'Link',
      target: 'Account',
      placeholder: t`Expense`,
      required: 1,
      disableCreation: true,
      getFilters: () => {
        return {
          isGroup: 0,
          rootType: 'Expense',
        };
      },
      formulaDependsOn: ['itemType'],
      async formula() {
        const cogs = await frappe.db
          .knex('Account')
          .where({ accountType: 'Cost of Goods Sold' });
        if (cogs.length === 0) {
          return '';
        } else {
          return cogs[0].name;
        }
      },
    },
    {
      fieldname: 'tax',
      label: t`Tax`,
      fieldtype: 'Link',
      target: 'Tax',
      placeholder: t`Tax`,
    },
    {
      fieldname: 'rate',
      label: t`Rate`,
      fieldtype: 'Currency',
      validate(value) {
        if (value.isNegative()) {
          throw new frappe.errors.ValidationError(t`Rate can't be negative.`);
        }
      },
    },
  ],
  quickEditFields: [
    'rate',
    'unit',
    'itemType',
    'for',
    'tax',
    'description',
    'incomeAccount',
    'expenseAccount',
  ],
  actions: [
    {
      label: t`New Invoice`,
      condition: (doc) => !doc.isNew(),
      action: async (doc, router) => {
        const invoice = await frappe.getNewDoc('SalesInvoice');
        invoice.append('items', {
          item: doc.name,
          rate: doc.rate,
          tax: doc.tax,
        });
        router.push(`/edit/SalesInvoice/${invoice.name}`);
      },
    },
    {
      label: t`New Bill`,
      condition: (doc) => !doc.isNew(),
      action: async (doc, router) => {
        const invoice = await frappe.getNewDoc('PurchaseInvoice');
        invoice.append('items', {
          item: doc.name,
          rate: doc.rate,
          tax: doc.tax,
        });
        router.push(`/edit/PurchaseInvoice/${invoice.name}`);
      },
    },
  ],
};
