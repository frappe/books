import { ledgerLink } from '../../../accounting/utils';
import { DateTime } from 'luxon';

export default {
  label: 'Journal Entry',
  name: 'JournalEntry',
  doctype: 'DocType',
  isSubmittable: 1,
  settings: 'JournalEntrySettings',
  fields: [
    {
      fieldname: 'entryType',
      label: 'Entry Type',
      fieldtype: 'Select',
      placeholder: 'Entry Type',
      options: [
        'Journal Entry',
        'Bank Entry',
        'Cash Entry',
        'Credit Card Entry',
        'Debit Note',
        'Credit Note',
        'Contra Entry',
        'Excise Entry',
        'Write Off Entry',
        'Opening Entry',
        'Depreciation Entry',
      ],
      required: 1,
    },
    {
      fieldname: 'date',
      label: 'Date',
      fieldtype: 'Date',
      default: () => DateTime.local().toISODate(),
    },
    {
      fieldname: 'accounts',
      label: 'Account Entries',
      fieldtype: 'Table',
      childtype: 'JournalEntryAccount',
      required: true,
    },
    {
      fieldname: 'referenceNumber',
      label: 'Reference Number',
      fieldtype: 'Data',
    },
    {
      fieldname: 'referenceDate',
      label: 'Reference Date',
      fieldtype: 'Date',
    },
    {
      fieldname: 'userRemark',
      label: 'User Remark',
      fieldtype: 'Text',
      placeholder: 'User Remark',
    },
    {
      fieldname: 'cancelled',
      label: 'Cancelled',
      fieldtype: 'Check',
      default: 0,
    },
  ],
  actions: [ledgerLink],
};
