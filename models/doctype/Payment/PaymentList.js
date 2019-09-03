import { _ } from 'frappejs/utils';
import indicators from 'frappejs/ui/constants/indicators';

export default {
  doctype: 'Payment',
  title: _('Payment'),
  columns: [
    'party',
    {
      label: 'Status',
      fieldname: 'status',
      fieldtype: 'Select',
      size: 'small',
      options: ['Status...', 'Reconciled', 'Not Reconciled'],
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
    'paymentType',
    'date',
    'clearanceDate',
    'amount'
  ]
};
