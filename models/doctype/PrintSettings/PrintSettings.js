import theme from '@/theme';

export default {
  name: 'PrintSettings',
  label: 'Print Settings',
  isSingle: 1,
  fields: [
    {
      fieldname: 'logo',
      label: 'Logo',
      fieldtype: 'AttachImage',
    },
    {
      fieldname: 'companyName',
      label: 'Company Name',
      fieldtype: 'Data',
    },
    {
      fieldname: 'email',
      label: 'Email',
      fieldtype: 'Data',
      placeholder: 'john@doe.com',
      validate: {
        type: 'email',
      },
    },
    {
      fieldname: 'displayLogo',
      label: 'Display Logo in Invoice',
      fieldtype: 'Check',
    },
    {
      fieldname: 'phone',
      label: 'Phone',
      fieldtype: 'Data',
      placeholder: '9888900000',
      validate: {
        type: 'phone',
      },
    },
    {
      fieldname: 'address',
      label: 'Address',
      fieldtype: 'Link',
      target: 'Address',
      placeholder: 'Click to create',
      inline: true,
    },
    {
      fieldname: 'template',
      label: 'Template',
      placeholder: 'Template',
      fieldtype: 'Select',
      options: ['Basic', 'Minimal', 'Business'],
      default: 'Basic',
    },
    {
      fieldname: 'color',
      label: 'Color',
      placeholder: 'Select Color',
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
          label: 'Black',
          value: theme.colors['black'],
        }),
    },
    {
      fieldname: 'font',
      label: 'Font',
      placeholder: 'Font',
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
