import { _ } from 'frappe/utils';

export default {
  doctype: 'GSTR3B',
  title: _('GSTR 3B Report'),
  columns: ['year', 'month'],
};
