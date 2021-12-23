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
      description: _('Sets the app-wide date display format.'),
    },
    {
      fieldname: 'displayPrecision',
      label: 'Display Precision',
      fieldtype: 'Int',
      default: 2,
      required: 1,
      minValue: 0,
      maxValue: 9,
      validate(value, doc) {
        if (value >= 0 && value <= 9) {
          return;
        }
        throw new frappe.errors.ValidationError(
          _('Display Precision should have a value between 0 and 9.')
        );
      },
      description: _('Sets how many digits are shown after the decimal point.'),
    },
    {
      fieldname: 'internalPrecision',
      label: 'Internal Precision',
      fieldtype: 'Int',
      default: 11,
      description: _(
        'Sets the internal precision used for monetary calculations. Above 6 should be sufficient for most currencies.'
      ),
    },
    {
      fieldname: 'hideGetStarted',
      label: 'Hide Get Started',
      fieldtype: 'Check',
      default: 0,
      description: _(
        'Hides the Get Started section from the sidebar. Change will be visible on restart or refreshing the app.'
      ),
    },
    {
      fieldname: 'autoUpdate',
      label: 'Auto Update',
      fieldtype: 'Check',
      default: 1,
      description: _(
        'Automatically checks for updates and download them if available. The update will be applied after you restart the app.'
      ),
    },
  ],
  quickEditFields: [
    'dateFormat',
    'displayPrecision',
    'hideGetStarted',
    'autoUpdate',
  ],
};
