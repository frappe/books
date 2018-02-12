const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class InvoiceSettingsMeta extends BaseMeta {
	setupMeta() {
		Object.assign(this, require('./invoice_settings.json'));
	}
}

class InvoiceSettings extends BaseDocument {
}

module.exports = {
	Document: InvoiceSettings,
	Meta: InvoiceSettingsMeta
};