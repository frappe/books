const server = require('frappejs/server');

module.exports = {
    async init_sqlite() {
        server.init();
        server.init_models();
        server.init_db({
            backend: 'sqlite',
            connection_params: {dbPath: 'test.db'}
        });
    }
}