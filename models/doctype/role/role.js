const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class RoleMeta extends BaseMeta {
	setup_meta() {
		Object.assign(this, require('./role.json'));
	}
}

class Role extends BaseDocument {
}

module.exports = {
	Document: Role,
	Meta: RoleMeta
};