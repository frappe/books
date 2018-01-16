const server = require('frappejs/server');

server.start({
    backend: 'sqllite',
    connection_params: {db_path: 'test.db'}
});