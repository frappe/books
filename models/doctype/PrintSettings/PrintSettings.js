const theme = require('@/theme');
const fontManager = require('font-manager');
const uniq = require('lodash/uniq');
let fonts = [];

module.exports = {
  name: 'PrintSettings',
  label: 'Print Settings',
  isSingle: 1,
  fields: [
    {
      fieldname: 'logo',
      label: 'Logo',
      fieldtype: 'AttachImage'
    },
    {
      fieldname: 'companyName',
      label: 'Company Name',
      fieldtype: 'Data'
    },
    {
      fieldname: 'email',
      label: 'Email',
      fieldtype: 'Data',
      placeholder: 'john@doe.com',
      validate: {
        type: 'email'
      }
    },
    {
      fieldname: 'displayLogo',
      label: 'Display Logo in Invoice',
      fieldtype: 'Check'
    },
    {
      fieldname: 'phone',
      label: 'Phone',
      fieldtype: 'Data',
      placeholder: '9888900000',
      validate: {
        type: 'phone'
      }
    },
    {
      fieldname: 'address',
      label: 'Address',
      fieldtype: 'Link',
      target: 'Address',
      placeholder: 'Click to create',
      inline: true
    },
    {
      fieldname: 'gstin',
      label: 'GSTIN',
      fieldtype: 'Data',
      placeholder: '27AAAAA0000A1Z5'
    },
    {
      fieldname: 'template',
      label: 'Template',
      fieldtype: 'Select',
      options: ['Basic', 'Minimal', 'Business'],
      default: 'Basic'
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
        'pink'
      ]
        .map(color => {
          let label = color[0].toUpperCase() + color.slice(1);
          return {
            label,
            value: theme.colors[color]['500']
          };
        })
        .concat({
          label: 'Black',
          value: theme.colors['black']
        })
    },
    {
      fieldname: 'font',
      label: 'Font',
      fieldtype: 'AutoComplete',
      getList() {
        return new Promise(resolve => {
          if (fonts.length > 0) {
            resolve(fonts);
          } else {
            fontManager.getAvailableFonts(_fonts => {
              fonts = ['Inter'].concat(uniq(_fonts.map(f => f.family)).sort());
              resolve(fonts);
            });
          }
        });
      },
      default: 'Inter'
    }
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
    'gstin'
  ]
};
