import { t } from 'frappe';
import { DateTime } from 'luxon';
import { ledgerLink } from '../../../accounting/utils';

export default {
  label: t`Journal Entry`,
  name: 'JournalEntry',
  doctype: 'DocType',
  isSubmittable: 1,
  settings: 'JournalEntrySettings',
  fields: [
    {
      fieldname: 'entryType',
      label: t`Entry Type`,
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
      label: t`Entry No`,
      fieldname: 'name',
      fieldtype: 'Data',
      required: 1,
      readOnly: 1,
    },
    {
      fieldname: 'date',
      label: t`Date`,
      fieldtype: 'Date',
      default: () => DateTime.local().toISODate(),
    },
    {
      fieldname: 'accounts',
      label: t`Account Entries`,
      fieldtype: 'Table',
      childtype: 'JournalEntryAccount',
      required: true,
    },
    {
      fieldname: 'referenceNumber',
      label: t`Reference Number`,
      fieldtype: 'Data',
    },
    {
      fieldname: 'referenceDate',
      label: t`Reference Date`,
      fieldtype: 'Date',
    },
    {
      fieldname: 'userRemark',
      label: t`User Remark`,
      fieldtype: 'Text',
      placeholder: 'User Remark',
    },
    {
      fieldname: 'cancelled',
      label: t`Cancelled`,
      fieldtype: 'Check',
      default: 0,
      readOnly: 1,
    },
  ],
  actions: [ledgerLink],
};
