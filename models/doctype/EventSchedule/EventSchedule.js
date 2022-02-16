import { t } from 'frappe';

export default {
  name: 'EventSchedule',
  doctype: 'DocType',
  isChild: 1,
  fields: [
    {
      fieldname: 'startTime',
      label: t`Start Time`,
      fieldtype: 'Data',
    },
    {
      fieldname: 'title',
      label: t`Title`,
      fieldtype: 'Data',
    },
  ],
};
