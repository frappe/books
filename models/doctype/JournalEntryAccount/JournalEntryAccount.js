export default {
  name: 'JournalEntryAccount',
  isChild: 1,
  fields: [
    {
      fieldname: 'account',
      label: 'Account',
      placeholder: 'Account',
      fieldtype: 'Link',
      target: 'Account',
      required: 1,
      groupBy: 'rootType',
      getFilters: () => ({ isGroup: 0 }),
    },
    {
      fieldname: 'debit',
      label: 'Debit',
      fieldtype: 'Currency',
      formula: autoDebitCredit('debit'),
    },
    {
      fieldname: 'credit',
      label: 'Credit',
      fieldtype: 'Currency',
      formula: autoDebitCredit('credit'),
    },
  ],
  tableFields: ['account', 'debit', 'credit'],
};

function autoDebitCredit(type) {
  let otherType = type === 'debit' ? 'credit' : 'debit';

  return (row, doc) => {
    if (!row[otherType].isZero()) return frappe.pesa(0);

    let totalType = doc.getSum('accounts', type, false);
    let totalOtherType = doc.getSum('accounts', otherType, false);

    if (totalType.lt(totalOtherType)) {
      return totalOtherType.sub(totalType);
    }
  };
}
