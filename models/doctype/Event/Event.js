import { t } from 'frappe';
import EventDocument from './EventDocument';

export default {
  name: 'Event',
  doctype: 'DocType',
  naming: 'random',
  documentClass: EventDocument,
  settings: 'EventSettings',
  fields: [
    {
      fieldname: 'title',
      label: t`Title`,
      fieldtype: 'Data',
    },
    {
      fieldname: 'date',
      label: t`Date`,
      fieldtype: 'Date',
    },
    {
      fieldname: 'schedule',
      fieldtype: 'Table',
      childtype: 'EventSchedule',
      label: t`Schedule`,
    },
  ],
  titleField: 'title',
  keywordFields: [],
  isSingle: 0,
  listSettings: {
    getFields(list) {
      return ['name', 'title', 'date'];
    },
    getRowHTML(list, data) {
      return `<div class='col-11'>${data.title} on ${data.date}</div>`;
    },
  },
};
