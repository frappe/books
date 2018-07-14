const numberFormat = require('./numberFormat');
const markdown = new (require('showdown').Converter)();
const moment = require('moment');
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

            value = moment(value).format(dateFormat.toUpperCase());

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