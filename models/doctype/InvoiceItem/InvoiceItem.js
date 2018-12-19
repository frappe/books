module.exports = {
  name: 'InvoiceItem',
  doctype: 'DocType',
  isSingle: 0,
  isChild: 1,
  keywordFields: [],
  layout: 'ratio',
  fields: [
    {
      fieldname: 'item',
      label: 'Item',
      fieldtype: 'Link',
      target: 'Item',
      required: 1,
      width: 2
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
      required: 1
    },
    {
      fieldname: 'rate',
      label: 'Rate',
      fieldtype: 'Currency',
      required: 1,
      formula: (row, doc) => doc.getFrom('Item', row.item, 'rate')
    },
    {
      fieldname: 'account',
      label: 'Account',
      hidden: 1,
      fieldtype: 'Link',
      target: 'Account',
      formula: (row, doc) => doc.getFrom('Item', row.item, 'incomeAccount')
    },
    {
      fieldname: 'tax',
      label: 'Tax',
      fieldtype: 'Link',
      target: 'Tax',
      formula:  async (row, doc) => {
        if (row.tax)
          return row.tax;
        else if(row.item){
          let taxRate = await doc.getFrom('Item', row.item, 'taxRate');
          taxRate = taxRate.substring(0,taxRate.length-1);
          if(taxRate === "0")
            return  "Exempt-0";
          let accountSettings =  await frappe.getSingle('AccountingSettings');
          let mainState = await doc.getFrom('Address', accountSettings.address, 'state');
          let custDetails =  await frappe.getDoc('Party', doc.customer);
          let custState = await doc.getFrom('Address', custDetails.address, 'state');
          if(mainState === custState)
            return `In State-${taxRate}`;
          else
            return `Out of State-${taxRate}`;
        }
        else
          return ;
      }
    },
    {
      fieldname: 'amount',
      label: 'Amount',
      fieldtype: 'Currency',
      readOnly: 1,
      disabled: true,
      formula: (row, doc) => row.quantity * row.rate
    },
    {
      fieldname: 'taxAmount',
      label: 'Tax Amount',
      hidden: 1,
      readOnly: 1,
      fieldtype: 'Text',
      formula: (row, doc) => doc.getRowTax(row)
    }
  ]
};
