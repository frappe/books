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
            fieldname: "startDate",
            label: "Start Date",
            fieldtype: "Date"
        },
        {
            fieldname: "startTime",
            label: "Start Time",
            fieldtype: "Time",
        },
        {
            fieldname: "endDate",
            label: "End Date",
            fieldtype: "Date"
        },
        {
            fieldname: "endTime",
            label: "End Time",
            fieldtype: "Time",
        },
        {
            fieldname: "daysUntil",
            label: "Days Until Event",
            fieldtype: "Data",
            formula: (doc) => {
                const today = DateTime.local();
                const eventDate = DateTime.fromISO(doc.startDate);
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
    layout: [
        {
            columns:[
                {fields: ["title"]}
            ]
        },
        {
            columns:[
                {fields: ["startDate","startTime"]},
                {fields: ["endDate","endTime"]},
            ]
        },
        {
            columns:[
                {fields:["daysUntil"]}
            ]
        },
    ],
    titleField: 'title',
    keywordFields: [],
    keywords: ['title','startDate','startTime','endDate','endTime'],
    isSingle: 0,
    listSettings: {
        getFields(list)  {
            return ['name', 'title', 'startDate'];
        },
        getRowHTML(list, data) {
            return `<div class="col-11">${data.title} on ${data.startDate}</div>`;
        }
    },
}