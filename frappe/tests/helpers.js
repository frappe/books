const server = require('frappe-core/frappe/server');

module.exports = {
	async init_sqlite() {
		server.init()
		server.init_db({
			backend: 'sqlite',
			connection_params: {db_path: 'test.db'}
		});
	}
}