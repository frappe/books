export default {
  name: 'AccountingLedgerEntry',
  label: 'Ledger Entry',
  naming: 'autoincrement',
  doctype: 'DocType',
  isSingle: 0,
  isChild: 0,
  keywordFields: ['account', 'party', 'referenceName'],
  fields: [
    {
      fieldname: 'date',
      label: 'Date',
      fieldtype: 'Date'
    },
    {
      fieldname: 'account',
      label: 'Account',
      fieldtype: 'Link',
      target: 'Account',
      required: 1
    },
    {
      fieldname: 'description',
      label: 'Description',
      fieldtype: 'Text'
    },
    {
      fieldname: 'party',
      label: 'Party',
      fieldtype: 'Link',
      target: 'Party'
    },
    {
      fieldname: 'debit',
      label: 'Debit',
      fieldtype: 'Currency'
    },
    {
      fieldname: 'credit',
      label: 'Credit',
      fieldtype: 'Currency'
    },
    {
      fieldname: 'againstAccount',
      label: 'Against Account',
      fieldtype: 'Text'
    },
    {
      fieldname: 'referenceType',
      label: 'Ref. Type',
      fieldtype: 'Data'
    },
    {
      fieldname: 'referenceName',
      label: 'Ref. Name',
      fieldtype: 'DynamicLink',
      references: 'referenceType'
    },
    {
      fieldname: 'balance',
      label: 'Balance',
      fieldtype: 'Currency'
    },
    {
      fieldname: 'reverted',
      label: 'Reverted',
      fieldtype: 'Check',
      default: 0
    }
  ],
  quickEditFields: [
    'date',
    'account',
    'description',
    'party',
    'debit',
    'credit',
    'againstAccount',
    'referenceType',
    'referenceName',
    'balance'
  ]
};
