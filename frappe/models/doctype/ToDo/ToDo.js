const { indicators } = require('../../../../src/colors');
const { BLUE, GREEN } = indicators;
const { t } = require('frappe');

module.exports = {
  name: 'ToDo',
  label: t`To Do`,
  naming: 'autoincrement',
  isSingle: 0,
  keywordFields: ['subject', 'description'],
  titleField: 'subject',
  indicators: {
    key: 'status',
    colors: {
      Open: BLUE,
      Closed: GREEN,
    },
  },
  fields: [
    {
      fieldname: 'subject',
      label: t`Subject`,
      placeholder: 'Subject',
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'status',
      label: t`Status`,
      fieldtype: 'Select',
      options: ['Open', 'Closed'],
      default: 'Open',
      required: 1,
    },
    {
      fieldname: 'description',
      label: t`Description`,
      fieldtype: 'Text',
    },
  ],

  quickEditFields: ['status', 'description'],

  actions: [
    {
      label: t`Close`,
      condition: (doc) => doc.status !== 'Closed',
      action: async (doc) => {
        await doc.set('status', 'Closed');
        await doc.update();
      },
    },
    {
      label: t`Re-Open`,
      condition: (doc) => doc.status !== 'Open',
      action: async (doc) => {
        await doc.set('status', 'Open');
        await doc.update();
      },
    },
  ],
};
