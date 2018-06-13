const { DateTime } = require('luxon');
const EventDocument = require('./EventDocument');

module.exports = {
    name: "Event",
    doctype: "DocType",
    naming: "random",
    documentClass: EventDocument,
    settings: "EventSettings",
    fields: [
        {
            fieldname: "title",
            label: "Title",
            fieldtype: "Data"
        },
        {
            fieldname: "start",
            label: "Date",
            fieldtype: "Date"
        },
        {
            fieldname: "end",
            label: "End Date",
            fieldtype: "Date"
        },
        {
            fieldname: "daysUntil",
            label: "Days Until Event",
            fieldtype: "Data",
            formula: (doc) => {
                const today = DateTime.local();
                const eventDate = DateTime.fromISO(doc.start);
                const diff = eventDate.diff(today);

                return diff.as('day');
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
        getFields(list)  {
            return ['name', 'title', 'start'];
        },
        getRowHTML(list, data) {
            return `<div class="col-11">${data.title} on ${data.start}</div>`;
        }
    },
}