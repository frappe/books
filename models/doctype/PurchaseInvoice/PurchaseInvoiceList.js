import { _ } from 'frappejs/utils';
import indicators from 'frappejs/ui/constants/indicators';

export default {
  doctype: 'PurchaseInvoice',
  title: _('Purchase Invoice'),
  columns: [
    'supplier',
    {
      label: 'Status',
      fieldname: 'status',
      fieldtype: 'Select',
      size: 'small',
      options: ['Status...', 'Paid', 'Pending'],
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
    'date',
    {
      label: 'Grand Total',
      fieldtype: 'Currency',
      getValue(doc) {
        return doc['grandTotal'];
      }
    },
    'outstandingAmount'
  ]
};
