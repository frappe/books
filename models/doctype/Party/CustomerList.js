import { _ } from 'frappe/utils';

export default {
  doctype: 'Customer',
  title: _('Customers'),
  columns: ['name', 'phone', 'outstandingAmount'],
};
