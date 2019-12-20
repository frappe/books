const { BLUE, GREEN } = require('frappejs/ui/constants/indicators');

module.exports = {
  name: 'ToDo',
  label: 'To Do',
  naming: 'autoincrement',
  isSingle: 0,
  keywordFields: ['subject', 'description'],
  titleField: 'subject',
  indicators: {
    key: 'status',
    colors: {
      Open: BLUE,
      Closed: GREEN
    }
  },
  fields: [
    {
      fieldname: 'subject',
      label: 'Subject',
      placeholder: 'Subject',
      fieldtype: 'Data',
      required: 1
    },
    {
      fieldname: 'status',
      label: 'Status',
      fieldtype: 'Select',
      options: ['Open', 'Closed'],
      default: 'Open',
      required: 1
    },
    {
      fieldname: 'description',
      label: 'Description',
      fieldtype: 'Text'
    }
  ],

  quickEditFields: ['status', 'description'],

  actions: [
    {
      label: 'Close',
      condition: doc => doc.status !== 'Closed',
      action: async doc => {
        await doc.set('status', 'Closed');
        await doc.update();
      }
    },
    {
      label: 'Re-Open',
      condition: doc => doc.status !== 'Open',
      action: async doc => {
        await doc.set('status', 'Open');
        await doc.update();
      }
    }
  ]
};
