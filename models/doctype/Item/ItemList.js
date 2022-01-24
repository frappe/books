import { t } from 'frappe';

export default {
  doctype: 'Item',
  title: t('Items'),
  columns: ['name', 'unit', 'tax', 'rate'],
};
