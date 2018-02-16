const server = require('frappejs/server');

server.start({
    backend: 'sqllite',
    connectionParams: {dbPath: 'test.db'}
});