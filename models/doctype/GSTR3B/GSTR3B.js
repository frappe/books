import frappe from 'frappejs';
import GSTR3B from './GSTR3BDocument.js'; 

export default {
  name: 'GSTR3B',
  label: 'GSTR 3B',
  doctype: 'DocType',
  documentClass: GSTR3B,
  print: {
    printFormat: 'GSTR3B Print Format'
  },
  keywordFields: ['name', 'month', 'year'],
  fields: [
    {
      fieldname: 'year',
      label: 'Year',
      fieldtype: 'Data',
      required: 1
    },
    {
      fieldname: 'month',
      label: 'Month',
      fieldtype: 'Select',
      options: [
        '',
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ],
      required: 1
    },
    {
      fieldname: 'jsonData',
      label: 'JSON Data',
      fieldtype: 'Code',
      formula: doc => doc.getJson(),
      required: 1,
      readOnly: 1,
      rows: 15
    }
  ],
  layout: [
    {
      columns: [{ fields: ['year', 'month', 'jsonData'] }]
    }
  ],
  links: [
    {
      label: 'Print PDF',
      condition: form => !form.doc._notInserted,
      action: async form => {
        form.$router.push({
          path: `/print/GSTR3B/${form.doc.name}`
        });
      }
    },
    {
      label: 'Delete',
      condition: form => !form.doc._notInserted,
      action: async form => {
        const doc = await frappe.getDoc('GSTR3B', form.doc.name);
        await doc.delete();
        form.$router.push({
          path: `/list/GSTR3B`
        });
      }
    }
  ]
};
