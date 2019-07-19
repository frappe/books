import { _ } from 'frappejs/utils';
import indicators from 'frappejs/ui/constants/indicators';

export default {
  doctype: 'Payment',
  title: _('Payment'),
  columns: [
    'party',
    {
      label: 'Payment',
      getValue(doc) {
        if (
          doc.submitted === 1 &&
          (doc.clearanceDate !== null || doc.paymentMethod === 'Cash')
        ) {
          return 'Reconciled';
        }
        return 'Not Reconciled';
      },
      getIndicator(doc) {
        if (
          doc.submitted === 1 &&
          (doc.clearanceDate !== null || doc.paymentMethod === 'Cash')
        ) {
          return indicators.GREEN;
        }
        return indicators.ORANGE;
      }
    },
    'account',
    'amount',
    'date',
    'clearanceDate',
    'name'
  ]
};
