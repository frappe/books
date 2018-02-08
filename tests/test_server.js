const server = require('frappejs/server');

if (require.main === module) {
    server.start({
        backend: 'sqlite',
        connection_params: {dbPath: 'test.db'}
    });
}