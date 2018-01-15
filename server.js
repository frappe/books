const server = require('frappe-core/server');

server.start({
    backend: 'sqlite',
    connection_params: {db_path: 'test.db'},
    static: './'
});