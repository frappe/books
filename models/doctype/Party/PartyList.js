import { _ } from 'frappejs/utils';

export default {
  doctype: 'Party',
  title: filters => (filters.customer ? 'Customer' : 'Supplier'),
  columns: ['name', 'defaultAccount', 'address']
};
