const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class SessionMeta extends BaseMeta {
	setupMeta() {
		Object.assign(this, require('./session.json'));
	}
}

class Session extends BaseDocument {

}

module.exports = {
	Document: Session,
	Meta: SessionMeta
};