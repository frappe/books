const server = require('frappe-core/server');

server.start({
    backend: 'sqllite',
    connection_params: {db_path: 'test.db'}
});