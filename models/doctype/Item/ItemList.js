import { _ } from 'frappe/utils';

export default {
  doctype: 'Item',
  title: _('Items'),
  columns: ['name', 'unit', 'tax', 'rate'],
};
