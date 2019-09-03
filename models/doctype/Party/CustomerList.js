import { _ } from 'frappejs/utils';

export default {
  doctype: 'Party',
  title: _('Customer'),
  columns: ['name', 'defaultAccount', 'address'],
  filters: {
    customer: 1
  }
};
