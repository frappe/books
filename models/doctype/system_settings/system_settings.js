const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class SystemSettingsMeta extends BaseMeta {
	setupMeta() {
		Object.assign(this, require('./system_settings.json'));
	}
}

class SystemSettings extends BaseDocument {
}

module.exports = {
	Document: SystemSettings,
	Meta: SystemSettingsMeta
};