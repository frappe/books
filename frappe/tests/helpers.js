const server = require('frappe-core/frappe/server');

module.exports = {
	async init_sqlite() {
		server.init({
			backend: 'sqllite',
			connection_params: {db_path: 'test.db'}
		});
	}
}