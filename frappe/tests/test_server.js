const server = require('frappe-core/frappe/server');

if (require.main === module) {
	server.start({backend: 'sqlite', connection_params: {db_path: 'test.db'}});
}