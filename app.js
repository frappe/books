const server = require('frappejs/server');

server.start({
    backend: 'sqllite',
    connection_params: {dbPath: 'test.db'}
});