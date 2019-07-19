import { _ } from 'frappejs/utils';
import indicators from 'frappejs/ui/constants/indicators';

export default {
  doctype: 'Bill',
  title: _('Bill'),
  columns: [
    'supplier',
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
    'outstandingAmount'
  ]
};
