const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class UserMeta extends BaseMeta {
	setupMeta() {
		Object.assign(this, require('./user.json'));
	}
}

class User extends BaseDocument {
}

module.exports = {
	Document: User,
	Meta: UserMeta
};