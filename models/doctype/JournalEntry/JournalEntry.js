const { ledgerLink } = require('../../../accounting/utils');
const { DateTime } = require('luxon');

module.exports = {
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
        'Depreciation Entry'
      ],
      required: 1
    },
    {
      fieldname: 'date',
      label: 'Date',
      fieldtype: 'Date',
      default: DateTime.local().toISODate()
    },
    {
      fieldname: 'accounts',
      label: 'Account Entries',
      fieldtype: 'Table',
      childtype: 'JournalEntryAccount',
      required: true
    },
    {
      fieldname: 'referenceNumber',
      label: 'Reference Number',
      fieldtype: 'Data'
    },
    {
      fieldname: 'referenceDate',
      label: 'Reference Date',
      fieldtype: 'Date'
    },
    {
      fieldname: 'userRemark',
      label: 'User Remark',
      fieldtype: 'Text',
      placeholder: 'User Remark'
    }
  ],
  actions: [
    {
      label: 'Revert',
      condition: doc => doc.submitted,
      action(doc) {
        doc.revert();
      }
    },
    ledgerLink
  ]
};
