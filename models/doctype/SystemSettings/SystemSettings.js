const { DateTime } = require('luxon');
const { _ } = require('frappejs/utils');

let dateFormatOptions = (() => {
  let formats = [
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'dd-MM-yyyy',
    'MM-dd-yyyy',
    'yyyy-MM-dd',
    'd MMM, y',
    'MMM d, y',
  ];

  let today = DateTime.local();

  return formats.map((format) => {
    return {
      label: today.toFormat(format),
      value: format,
    };
  });
})();

module.exports = {
  name: 'SystemSettings',
  label: 'System Settings',
  doctype: 'DocType',
  isSingle: 1,
  isChild: 0,
  keywordFields: [],
  fields: [
    {
      fieldname: 'dateFormat',
      label: 'Date Format',
      fieldtype: 'Select',
      options: dateFormatOptions,
      default: 'MMM d, y',
      required: 1,
    },
    {
      fieldname: 'floatPrecision',
      label: 'Precision',
      fieldtype: 'Select',
      options: ['2', '3', '4', '5'],
      default: '2',
      required: 1,
    },
    {
      fieldname: 'hideGetStarted',
      label: 'Hide Get Started',
      fieldtype: 'Check',
      default: 0,
    },
    {
      fieldname: 'autoUpdate',
      label: 'Auto Update',
      fieldtype: 'Check',
      default: 1,
      description: _(
        'Automatically check for updates and download them if available. The update will be applied after you restart the app.'
      ),
    },
  ],
  quickEditFields: [
    'dateFormat',
    'floatPrecision',
    'hideGetStarted',
    'autoUpdate',
  ],
};
