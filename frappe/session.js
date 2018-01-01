const frappe = require('frappe-core');

class Session {
	constructor(user, user_key) {
		this.user = user || 'guest';
		if (this.user !== 'guest') {
			this.login(user_key);
		}
	}

	login(user_key) {
		// could be password, sessionid, otp
	}

}

module.exports = { Session: Session };