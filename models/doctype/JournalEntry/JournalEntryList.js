import { _ } from 'frappejs/utils';
import Badge from '@/components/Badge';

export default {
  doctype: 'JournalEntry',
  title: _('Journal Entry'),
  formRoute: name => `/edit/JournalEntry/${name}`,
  columns: [
    'date',
    {
      label: 'Status',
      fieldtype: 'Select',
      size: 'small',
      render(doc) {
        let status = 'Draft';
        let color = 'gray';
        if (doc.submitted === 1) {
          color = 'green';
          status = 'Submitted';
        }

        if (doc.cancelled === 1) {
          color = 'red';
          status = 'Cancelled';
        }

        return {
          template: `<Badge class="text-xs" color="${color}">${status}</Badge>`,
          components: { Badge },
        };
      },
    },
    {
      label: 'Entry ID',
      fieldname: 'name',
      fieldtype: 'Data',
      getValue(doc) {
        return doc.name
      }
    },
    'entryType',
    'referenceNumber'
  ]
};
