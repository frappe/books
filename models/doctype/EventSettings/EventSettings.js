import { t } from 'frappe';

export default {
  name: 'EventSettings',
  label: t`Event Settings`,
  doctype: 'DocType',
  isSingle: 1,
  isChild: 0,
  keywordFields: [],
  fields: [
    {
      fieldname: 'enableNotifications',
      label: t`Enable Notifications`,
      fieldtype: 'Check',
    },
  ],
};
