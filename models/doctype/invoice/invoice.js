const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class InvoiceMeta extends BaseMeta {
	setupMeta() {
		Object.assign(this, require('./invoice.json'));
	}
}

class Invoice extends BaseDocument {
	get_total() {
		return this.items.map(d => (d.amount || 0)).reduce((a, b) => a + b, 0);
	}
}

module.exports = {
	Document: Invoice,
	Meta: InvoiceMeta
};