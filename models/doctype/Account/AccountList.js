import { t } from 'frappe';

export default {
  doctype: 'Account',
  title: t('Account'),
  columns: ['name', 'parentAccount', 'rootType'],
};
