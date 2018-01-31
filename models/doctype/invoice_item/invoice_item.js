const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class InvoiceItemMeta extends BaseMeta {
	setup_meta() {
		Object.assign(this, require('./invoice_item.json'));
	}
}

class InvoiceItem extends BaseDocument {
}

module.exports = {
	Document: InvoiceItem,
	Meta: InvoiceItemMeta
};