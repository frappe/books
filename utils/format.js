const numberFormat = require('./numberFormat');
// const markdown = new (require('showdown').Converter)();
const luxon = require('luxon');
const frappe = require('frappejs');

module.exports = {
  format(value, field) {
    if (typeof field === 'string') {
      field = { fieldtype: field };
    }
    if (field.fieldtype === 'Currency') {
      value = numberFormat.formatNumber(value);
    } else if (field.fieldtype === 'Text') {
      // value = markdown.makeHtml(value || '');
    } else if (field.fieldtype === 'Date') {
      let dateFormat;
      if (!frappe.SystemSettings) {
        dateFormat = 'yyyy-MM-dd';
      } else {
        dateFormat = frappe.SystemSettings.dateFormat;
      }

      value = luxon.DateTime.fromISO(value).toFormat(dateFormat);
      if (value === 'Invalid DateTime') {
        value = '';
      }
    } else if (field.fieldtype === 'Check') {
      typeof parseInt(value) === 'number'
        ? (value = parseInt(value))
        : (value = Boolean(value));
    } else {
      if (value === null || value === undefined) {
        value = '';
      } else {
        value = value + '';
      }
    }
    return value;
  }
};
