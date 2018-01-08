const server = require('frappe-core/frappe/server');

if (require.main === module) {
	server.start({backend: 'sqllite', connection_params: {db_path: 'test.db'}});
}