import { _ } from 'frappejs/utils';

export default {
  doctype: 'Party',
  listName: 'Supplier',
  title: _('Supplier'),
  columns: ['name', 'defaultAccount', 'address'],
  filters: {
    supplier: 1
  }
};
