import { t } from 'frappe';
import { getStatusColumn } from '../Transaction/Transaction';

export default {
  doctype: 'SalesInvoice',
  title: t('Invoices'),
  formRoute: (name) => `/edit/SalesInvoice/${name}`,
  columns: [
    'customer',
    'name',
    getStatusColumn('SalesInvoice'),
    'date',
    'grandTotal',
    'outstandingAmount',
  ],
};
