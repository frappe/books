import { t } from 'frappe';

export default {
  name: 'Color',
  doctype: 'DocType',
  fields: [
    {
      fieldname: 'name',
      fieldtype: 'Data',
      label: t`Color`,
    },
    {
      fieldname: 'hexvalue',
      fieldtype: 'Data',
      label: t`Hex Value`,
    },
  ],
};
