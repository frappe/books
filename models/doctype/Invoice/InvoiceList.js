import { _ } from 'frappejs/utils';
import indicators from 'frappejs/ui/constants/indicators';

export default {
  doctype: 'Invoice',
  title: _('Invoice'),
  columns: [
    'customer',
    {
      label: 'Status',
      getValue(doc) {
        if (doc.submitted === 1 && doc.outstandingAmount === 0.0) {
          return 'Paid';
        }
        return 'Pending';
      },
      getIndicator(doc) {
        if (doc.submitted === 1 && doc.outstandingAmount === 0.0) {
          return indicators.GREEN;
        }
        return indicators.ORANGE;
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