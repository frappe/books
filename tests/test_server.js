const server = require('frappejs/server');

if (require.main === module) {
    server.start({
        backend: 'sqlite',
        connectionParams: {dbPath: 'test.db'}
    });
}