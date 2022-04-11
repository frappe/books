import { t } from 'frappe';
import { DateTime } from 'luxon';
import { ledgerLink } from '../../../accounting/utils';
import { DEFAULT_NUMBER_SERIES } from '../../../frappe/utils/consts';

export const journalEntryTypeMap = {
  'Journal Entry': t`Journal Entry`,
  'Bank Entry': t`Bank Entry`,
  'Cash Entry': t`Cash Entry`,
  'Credit Card Entry': t`Credit Card Entry`,
  'Debit Note': t`Debit Note`,
  'Credit Note': t`Credit Note`,
  'Contra Entry': t`Contra Entry`,
  'Excise Entry': t`Excise Entry`,
  'Write Off Entry': t`Write Off Entry`,
  'Opening Entry': t`Opening Entry`,
  'Depreciation Entry': t`Depreciation Entry`,
};

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
      placeholder: t`Entry Type`,
      options: Object.keys(journalEntryTypeMap),
      map: journalEntryTypeMap,
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
      placeholder: t`User Remark`,
    },
    {
      fieldname: 'cancelled',
      label: t`Cancelled`,
      fieldtype: 'Check',
      default: 0,
      readOnly: 1,
    },
    {
      fieldname: 'numberSeries',
      label: t`Number Series`,
      fieldtype: 'Link',
      target: 'NumberSeries',
      required: 1,
      getFilters: () => {
        return { referenceType: 'JournalEntry' };
      },
      default: DEFAULT_NUMBER_SERIES['JournalEntry'],
    },
  ],
  actions: [ledgerLink],
};
