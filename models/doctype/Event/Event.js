const { DateTime } = require('luxon');
const EventDocument = require('./EventDocument');

var hoursArray = [];
var minutesArray = [];

for(var i=0; i<25; i++)
{
    hoursArray.push(String(i))
}

for(var i=0; i<61; i++)
{
    minutesArray.push(String(i))
}

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
            fieldname: "startHour",
            label: "Start Hour",
            fieldtype: "Select",
            options: hoursArray
        },
        {
            fieldname: "startMinute",
            label: "Start Minute",
            fieldtype: "Select",
            options: minutesArray
        },
        {
            fieldname: "endDate",
            label: "End Date",
            fieldtype: "Date"
        },
        {
            fieldname: "endHour",
            label: "End Hour",
            fieldtype: "Select",
            options: hoursArray
        },
        {
            fieldname: "endMinute",
            label: "End Minute",
            fieldtype: "Select",
            options: minutesArray
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
        // {
        //     fieldname: 'schedule',
        //     fieldtype: 'Table',
        //     childtype: 'EventSchedule',
        //     label: 'Schedule'
        // }
    ],
    layout: [
        {
            columns:[
                {fields: ["title"]}
            ]
        },
        {
            columns:[
                {fields: ["startDate","startHour","startMinute"]},
                {fields: ["endDate","endHour","endMinute"]},
            ]
        },
        {
            columns:[
                {fields:["daysUntil"]}
            ]
        }
    ],
    titleField: 'title',
    keywordFields: [],
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