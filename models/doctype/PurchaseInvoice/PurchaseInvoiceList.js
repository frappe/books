import { _ } from 'frappejs/utils';
import indicators from 'frappejs/ui/constants/indicators';

export default {
  doctype: 'PurchaseInvoice',
  title: _('Purchase Invoice'),
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
