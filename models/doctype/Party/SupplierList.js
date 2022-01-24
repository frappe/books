import { t } from 'frappe';

export default {
  doctype: 'Supplier',
  title: t('Supplier'),
  columns: ['name', 'phone', 'outstandingAmount'],
};
