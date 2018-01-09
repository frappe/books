const server = require('frappe-core/frappe/server');

server.start({
	backend: 'sqllite',
	connection_params: {db_path: 'test.db'},
	static: './'
});