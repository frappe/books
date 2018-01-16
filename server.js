const server = require('frappejs/server');

server.start({
    backend: 'sqlite',
    connection_params: {db_path: 'test.db'},
    static: './'
});