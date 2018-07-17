const numberFormat = require('./numberFormat');
const markdown = new (require('showdown').Converter)();
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
            value = markdown.makeHtml(value || '');

        } else if (field.fieldtype === 'Date') {
            let dateFormat;
            if (!frappe.SystemSettings) {
                dateFormat = 'yyyy-mm-dd';
            } else {
                dateFormat = frappe.SystemSettings.dateFormat;
            }

            value = luxon.DateTime.fromISO(value).toFormat(dateFormat);

        } else {
            if (value === null || value === undefined) {
                value = '';
            } else {
                value = value + '';
            }
        }
        return value;
    }
}