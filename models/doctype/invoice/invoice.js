const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class InvoiceMeta extends BaseMeta {
	setupMeta() {
		Object.assign(this, require('./invoice.json'));
	}
}

class Invoice extends BaseDocument {
}

module.exports = {
	Document: Invoice,
	Meta: InvoiceMeta
};