import { _ } from 'frappejs/utils';

export default {
  doctype: 'Invoice',
  title: _('Invoice'),
  columns: [
    'customer',
    {
      label: 'Status',
      getValue(doc) {
        return doc.submitted ? 'Paid' : 'Pending';
      }
    },
    'grandTotal',
    'date',
    {
      label: 'INV #',
      getValue(doc) {
        return doc.name;
      }
    }
  ]
}