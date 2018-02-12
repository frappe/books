const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class SingleValueMeta extends BaseMeta {
	setupMeta() {
		Object.assign(this, require('./single_value.json'));
	}
}

class SingleValue extends BaseDocument {
}

module.exports = {
	Document: SingleValue,
	Meta: SingleValueMeta
};