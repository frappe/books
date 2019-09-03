import { _ } from 'frappejs/utils';

export default {
  doctype: 'Party',
  title: _('Supplier'),
  columns: ['name', 'defaultAccount', 'address'],
  filters: {
    supplier: 1
  }
};
