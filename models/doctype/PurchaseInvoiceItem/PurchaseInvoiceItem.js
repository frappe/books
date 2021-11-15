export default {
  name: 'PurchaseInvoiceItem',
  doctype: 'DocType',
  isChild: 1,
  keywordFields: [],
  tableFields: ['item', 'tax', 'quantity', 'rate', 'amount'],
  fields: [
    {
      fieldname: 'item',
      label: 'Item',
      fieldtype: 'Link',
      target: 'Item',
      required: 1,
      getFilters(_, doc) {
        let items = doc.parentdoc.items.map(d => d.item).filter(Boolean);
        if (items.length > 0) {
          return {
            name: ['not in', items]
          };
        }
      }
    },
    {
      fieldname: 'description',
      label: 'Description',
      fieldtype: 'Text',
      formula: (row, doc) => doc.getFrom('Item', row.item, 'description'),
      hidden: 1
    },
    {
      fieldname: 'quantity',
      label: 'Quantity',
      fieldtype: 'Float',
      required: 1,
      formula: () => 1
    },
    {
      fieldname: 'rate',
      label: 'Rate',
      fieldtype: 'Currency',
      required: 1,
      formula: async (row, doc) => {
        const baseRate = (await doc.getFrom('Item', row.item, 'rate')) || 0;
        const exchangeRate = doc.exchangeRate ?? 1;
        return baseRate / exchangeRate;
      },
      getCurrency: (row, doc) => doc.currency
    },
    {
      fieldname: 'baseRate',
      label: 'Rate (Company Currency)',
      fieldtype: 'Currency',
      formula: (row, doc) => row.rate * doc.exchangeRate,
      readOnly: 1
    },
    {
      fieldname: 'account',
      label: 'Account',
      fieldtype: 'Link',
      target: 'Account',
      required: 1,
      formula: (row, doc) => doc.getFrom('Item', row.item, 'expenseAccount')
    },
    {
      fieldname: 'tax',
      label: 'Tax',
      fieldtype: 'Link',
      target: 'Tax',
      formula: (row, doc) => {
        if (row.tax) return row.tax;
        return doc.getFrom('Item', row.item, 'tax');
      }
    },
    {
      fieldname: 'amount',
      label: 'Amount',
      fieldtype: 'Currency',
      readOnly: 1,
      formula: row => row.quantity * row.rate,
      getCurrency: (row, doc) => doc.currency
    },
    {
      fieldname: 'baseAmount',
      label: 'Amount (Company Currency)',
      fieldtype: 'Currency',
      readOnly: 1,
      formula: (row, doc) => row.amount * doc.exchangeRate
    }
  ]
};
