const { DateTime } = require('luxon');
const EventDocument = require('./EventDocument');

module.exports = {
  name: 'Event',
  doctype: 'DocType',
  naming: 'random',
  documentClass: EventDocument,
  settings: 'EventSettings',
  fields: [
    {
      fieldname: 'title',
      label: 'Title',
      fieldtype: 'Data'
    },
    {
      fieldname: 'date',
      label: 'Date',
      fieldtype: 'Date'
    },
    {
      fieldname: 'daysUntil',
      label: 'Days Until Event',
      fieldtype: 'Data',
      formula: (doc) => {
        const today = DateTime.local();
        const eventDate = DateTime.fromISO(doc.date);
        const diff = eventDate.diff(today);

        return Math.floor(diff.as('day'));
      }
    },
    {
      fieldname: 'schedule',
      fieldtype: 'Table',
      childtype: 'EventSchedule',
      label: 'Schedule'
    }
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
    }
  }
};
