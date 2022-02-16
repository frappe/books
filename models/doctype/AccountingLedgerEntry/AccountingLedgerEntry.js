import { t } from 'frappe';

export default {
  name: 'AccountingLedgerEntry',
  label: t`Ledger Entry`,
  naming: 'autoincrement',
  doctype: 'DocType',
  isSingle: 0,
  isChild: 0,
  keywordFields: ['account', 'party', 'referenceName'],
  fields: [
    {
      fieldname: 'date',
      label: t`Date`,
      fieldtype: 'Date',
    },
    {
      fieldname: 'account',
      label: t`Account`,
      fieldtype: 'Link',
      target: 'Account',
      required: 1,
    },
    {
      fieldname: 'description',
      label: t`Description`,
      fieldtype: 'Text',
    },
    {
      fieldname: 'party',
      label: t`Party`,
      fieldtype: 'Link',
      target: 'Party',
    },
    {
      fieldname: 'debit',
      label: t`Debit`,
      fieldtype: 'Currency',
    },
    {
      fieldname: 'credit',
      label: t`Credit`,
      fieldtype: 'Currency',
    },
    {
      fieldname: 'againstAccount',
      label: t`Against Account`,
      fieldtype: 'Text',
    },
    {
      fieldname: 'referenceType',
      label: t`Ref. Type`,
      fieldtype: 'Data',
    },
    {
      fieldname: 'referenceName',
      label: t`Ref. Name`,
      fieldtype: 'DynamicLink',
      references: 'referenceType',
    },
    {
      fieldname: 'balance',
      label: t`Balance`,
      fieldtype: 'Currency',
    },
    {
      fieldname: 'reverted',
      label: t`Reverted`,
      fieldtype: 'Check',
      default: 0,
    },
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
    'balance',
  ],
};
