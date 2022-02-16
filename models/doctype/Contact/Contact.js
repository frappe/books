import { t } from 'frappe';

export default {
  name: 'Contact',
  doctype: 'DocType',
  isSingle: 0,
  naming: 'autoincrement',
  pageSettings: {
    hideTitle: true,
  },
  titleField: 'fullName',
  keywordFields: ['fullName'],
  fields: [
    {
      fieldname: 'fullName',
      label: t`Full Name`,
      fieldtype: 'Data',
      required: 1,
    },
    {
      fieldname: 'emailAddress',
      label: t`Email Address`,
      fieldtype: 'Data',
    },
    {
      fieldname: 'userId',
      label: t`User ID`,
      fieldtype: 'Link',
      target: 'User',
      hidden: 1,
    },
    {
      fieldname: 'status',
      label: t`Status`,
      fieldtype: 'Select',
      options: ['Passive', 'Open', 'Replied'],
    },
    {
      fieldname: 'gender',
      label: t`Gender`,
      fieldtype: 'Select',
      options: ['Male', 'Female', 'Gender'],
    },
    {
      fieldname: 'mobileNumber',
      label: t`Mobile Number`,
      fieldtype: 'Data',
    },
    {
      fieldname: 'phone',
      label: t`Phone`,
      fieldtype: 'Data',
    },
  ],

  events: {
    validate: (doc) => {},
  },

  listSettings: {
    getFields(list) {
      return ['fullName'];
    },
    getRowHTML(list, data) {
      return `<div class="col-11">${list.getNameHTML(data)}</div>`;
    },
  },

  layout: [
    // section 1
    {
      columns: [
        { fields: ['fullName', 'emailAddress', 'userId', 'status'] },
        { fields: ['postalCode', 'gender', 'phone', 'mobileNumber'] },
      ],
    },
  ],
};
