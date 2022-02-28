import { t } from 'frappe';
export default {
  name: 'PurchaseInvoiceItem',
  doctype: 'DocType',
  isChild: 1,
  keywordFields: [],
  tableFields: ['item', 'tax', 'quantity', 'rate', 'amount'],
  fields: [
    {
      fieldname: 'item',
      label: t`Item`,
      fieldtype: 'Link',
      target: 'Item',
      required: 1,
      getFilters(_, doc) {
        let items = doc.parentdoc.items.map((d) => d.item).filter(Boolean);
        if (items.length > 0) {
          return {
            name: ['not in', items],
          };
        }
      },
    },
    {
      fieldname: 'description',
      label: t`Description`,
      fieldtype: 'Text',
      formula: (row, doc) => doc.getFrom('Item', row.item, 'description'),
      hidden: 1,
    },
    {
      fieldname: 'quantity',
      label: t`Quantity`,
      fieldtype: 'Float',
      required: 1,
      default: 1,
    },
    {
      fieldname: 'rate',
      label: t`Rate`,
      fieldtype: 'Currency',
      required: 1,
      formula: async (row, doc) => {
        const baseRate =
          (await doc.getFrom('Item', row.item, 'rate')) || frappe.pesa(0);
        return baseRate.div(doc.exchangeRate);
      },
      getCurrency: (row, doc) => doc.currency,
      validate(value) {
        if (value.gte(0)) {
          return;
        }

        throw new frappe.errors.ValidationError(
          frappe.t`Rate (${frappe.format(
            value,
            'Currency'
          )}) cannot be less zero.`
        );
      },
    },
    {
      fieldname: 'baseRate',
      label: t`Rate (Company Currency)`,
      fieldtype: 'Currency',
      formula: (row, doc) => row.rate.mul(doc.exchangeRate),
      readOnly: 1,
    },
    {
      fieldname: 'account',
      label: t`Account`,
      fieldtype: 'Link',
      target: 'Account',
      required: 1,
      readOnly: 1,
      formula: (row, doc) => doc.getFrom('Item', row.item, 'expenseAccount'),
    },
    {
      fieldname: 'tax',
      label: t`Tax`,
      fieldtype: 'Link',
      target: 'Tax',
      formula: (row, doc) => {
        if (row.tax) return row.tax;
        return doc.getFrom('Item', row.item, 'tax');
      },
    },
    {
      fieldname: 'amount',
      label: t`Amount`,
      fieldtype: 'Currency',
      readOnly: 1,
      formula: (row) => row.rate.mul(row.quantity),
      getCurrency: (row, doc) => doc.currency,
    },
    {
      fieldname: 'baseAmount',
      label: t`Amount (Company Currency)`,
      fieldtype: 'Currency',
      readOnly: 1,
      formula: (row, doc) => row.amount.mul(doc.exchangeRate),
    },
  ],
};
