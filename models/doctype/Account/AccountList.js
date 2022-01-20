import { _ } from 'frappe/utils';

export default {
  doctype: 'Account',
  title: _('Account'),
  columns: ['name', 'parentAccount', 'rootType'],
};
