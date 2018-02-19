const server = require('frappejs/server');

server.start({
    backend: 'sqlite',
    connectionParams: {dbPath: 'test.db'},
    static: './',
    models: require('./models')
});