import { _ } from 'frappe/utils';

export default {
  doctype: 'Supplier',
  title: _('Supplier'),
  columns: ['name', 'phone', 'outstandingAmount'],
};
