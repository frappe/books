import { t } from 'frappejs/utils';
import { getStatusColumn } from '../Transaction/Transaction';

export default {
  doctype: 'PurchaseInvoice',
  title: t('Bills'),
  formRoute: (name) => `/edit/PurchaseInvoice/${name}`,
  columns: [
    'supplier',
    'name',
    getStatusColumn('PurchaseInvoice'),
    'date',
    'grandTotal',
    'outstandingAmount',
  ],
};
