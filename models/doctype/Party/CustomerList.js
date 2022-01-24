import { t } from 'frappe';

export default {
  doctype: 'Customer',
  title: t('Customers'),
  columns: ['name', 'phone', 'outstandingAmount'],
};
