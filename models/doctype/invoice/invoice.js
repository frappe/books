const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class InvoiceMeta extends BaseMeta {
	setup_meta() {
		Object.assign(this, require('./invoice.json'));
	}
}

class Invoice extends BaseDocument {
	setup() {
		this.addHandler('validate');
	}

	validate() {
		this.total = this.get_total();
	}

	get_total() {
		return this.items.map(d => (d.amount || 0)).reduce((a, b) => a + b, 0);
	}
}

module.exports = {
	Document: Invoice,
	Meta: InvoiceMeta
};