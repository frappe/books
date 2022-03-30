import theme from '@/theme';
import { t } from 'frappe';

export default {
  name: 'PrintSettings',
  label: t`Print Settings`,
  isSingle: 1,
  fields: [
    {
      fieldname: 'logo',
      label: t`Logo`,
      fieldtype: 'AttachImage',
    },
    {
      fieldname: 'companyName',
      label: t`Company Name`,
      fieldtype: 'Data',
    },
    {
      fieldname: 'email',
      label: t`Email`,
      fieldtype: 'Data',
      placeholder: t`john@doe.com`,
      validate: {
        type: 'email',
      },
    },
    {
      fieldname: 'displayLogo',
      label: t`Display Logo in Invoice`,
      fieldtype: 'Check',
    },
    {
      fieldname: 'phone',
      label: t`Phone`,
      fieldtype: 'Data',
      placeholder: t`9888900000`,
      validate: {
        type: 'phone',
      },
    },
    {
      fieldname: 'address',
      label: t`Address`,
      fieldtype: 'Link',
      target: 'Address',
      placeholder: t`Click to create`,
      inline: true,
    },
    {
      fieldname: 'template',
      label: t`Template`,
      placeholder: t`Template`,
      fieldtype: 'Select',
      options: ['Basic', 'Minimal', 'Business'],
      default: 'Basic',
    },
    {
      fieldname: 'color',
      label: t`Color`,
      placeholder: t`Select Color`,
      fieldtype: 'Color',
      colors: [
        'red',
        'orange',
        'yellow',
        'green',
        'teal',
        'blue',
        'indigo',
        'purple',
        'pink',
      ]
        .map((color) => {
          let label = color[0].toUpperCase() + color.slice(1);
          return {
            label,
            value: theme.colors[color]['500'],
          };
        })
        .concat({
          label: t`Black`,
          value: theme.colors['black'],
        }),
    },
    {
      fieldname: 'font',
      label: t`Font`,
      placeholder: t`Font`,
      fieldtype: 'Select',
      options: ['Inter', 'Times New Roman', 'Arial', 'Courier'],
      default: 'Inter',
    },
  ],
  quickEditFields: [
    'logo',
    'displayLogo',
    'template',
    'color',
    'font',
    'email',
    'phone',
    'address',
  ],
};
