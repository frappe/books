const numberFormat = require('./numberFormat');
// const markdown = new (require('showdown').Converter)();
const luxon = require('luxon');
const frappe = require('frappejs');

module.exports = {
  format(value, df, doc) {
    if (!df) {
      return value;
    }

    if (typeof df === 'string') {
      df = { fieldtype: df };
    }

    if (df.fieldtype === 'Currency') {
      value = formatCurrency(value, df, doc);
    } else if (df.fieldtype === 'Text') {
      // value = markdown.makeHtml(value || '');
    } else if (df.fieldtype === 'Date') {
      let dateFormat;
      if (!frappe.SystemSettings) {
        dateFormat = 'yyyy-MM-dd';
      } else {
        dateFormat = frappe.SystemSettings.dateFormat;
      }

      if (typeof value === 'string') {
        // ISO String
        value = luxon.DateTime.fromISO(value);
      } else if (Object.prototype.toString.call(value) === '[object Date]') {
        // JS Date
        value = luxon.DateTime.fromJSDate(value);
      }

      value = value.toFormat(dateFormat);
      if (value === 'Invalid DateTime') {
        value = '';
      }
    } else if (df.fieldtype === 'Check') {
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

function formatCurrency(value, df, doc) {
  let currency = df.currency || '';
  if (doc && df.getCurrency) {
    if (doc.meta && doc.meta.isChild) {
      currency = df.getCurrency(doc, doc.parentdoc);
    } else {
      currency = df.getCurrency(doc);
    }
  }

  if (!currency) {
    currency = frappe.AccountingSettings.currency;
  }

  let currencySymbol = frappe.currencySymbols[currency] || '';
  return currencySymbol + ' ' + numberFormat.formatNumber(value);
}
