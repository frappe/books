const numberFormat = require('./numberFormat');
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
  },
};

function getCurrency(df, doc) {
  if (!(doc && df.getCurrency)) {
    return df.currency || frappe.AccountingSettings.currency || '';
  }

  if (doc.meta && doc.meta.isChild) {
    return df.getCurrency(doc, doc.parentdoc);
  }

  return df.getCurrency(doc);
}

function formatCurrency(value, df, doc) {
  const currency = getCurrency(df, doc);
  let valueString;
  try {
    valueString = numberFormat.formatCurrency(value);
  } catch (err) {
    err.message += ` value: '${value}', type: ${typeof value}`;
    console.error(df);
    throw err;
  }
  const currencySymbol = frappe.currencySymbols[currency];

  if (currencySymbol) {
    return currencySymbol + ' ' + valueString;
  }
  return valueString;
}
