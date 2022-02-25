const { DateTime } = require('luxon');
const { t } = require('frappe');
const {
  DEFAULT_DISPLAY_PRECISION,
  DEFAULT_INTERNAL_PRECISION,
  DEFAULT_LOCALE,
} = require('../../../utils/consts');

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
  label: t`System Settings`,
  doctype: 'DocType',
  isSingle: 1,
  isChild: 0,
  keywordFields: [],
  fields: [
    {
      fieldname: 'dateFormat',
      label: t`Date Format`,
      fieldtype: 'Select',
      options: dateFormatOptions,
      default: 'MMM d, y',
      required: 1,
      description: t`Sets the app-wide date display format.`,
    },
    {
      fieldname: 'locale',
      label: t`Locale`,
      fieldtype: 'Data',
      default: DEFAULT_LOCALE,
      description: t`Set the local code. This is used for number formatting.`,
    },
    {
      fieldname: 'displayPrecision',
      label: t`Display Precision`,
      fieldtype: 'Int',
      default: DEFAULT_DISPLAY_PRECISION,
      required: 1,
      minValue: 0,
      maxValue: 9,
      validate(value, doc) {
        if (value >= 0 && value <= 9) {
          return;
        }
        throw new frappe.errors.ValidationError(
          t`Display Precision should have a value between 0 and 9.`
        );
      },
      description: t`Sets how many digits are shown after the decimal point.`,
    },
    {
      fieldname: 'internalPrecision',
      label: t`Internal Precision`,
      fieldtype: 'Int',
      minValue: 0,
      default: DEFAULT_INTERNAL_PRECISION,
      description: t`Sets the internal precision used for monetary calculations. Above 6 should be sufficient for most currencies.`,
    },
    {
      fieldname: 'hideGetStarted',
      label: t`Hide Get Started`,
      fieldtype: 'Check',
      default: 0,
      description: t`Hides the Get Started section from the sidebar. Change will be visible on restart or refreshing the app.`,
    },
    {
      fieldname: 'autoReportErrors',
      label: t`Hide & Auto Report Errors`,
      fieldtype: 'Check',
      default: 0,
      description: t`Prevent errors from showing and automatically report all errors.`,
    },
  ],
  quickEditFields: [
    'locale',
    'dateFormat',
    'displayPrecision',
    'hideGetStarted',
    'autoReportErrors',
  ],
};
