const server = require('frappe-core/frappe/server');

server.start({
	backend: 'sqlite',
	connection_params: {db_path: 'test.db'},
	static: './'
});