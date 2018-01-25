const FloatControl = require('./float');
const frappe = require('frappejs');

class CurrencyControl extends FloatControl {
	parse(value) {
		return frappe.parse_number(value);
	}
	format(value) {
		return frappe.format_number(value);
	}
};

module.exports = CurrencyControl;