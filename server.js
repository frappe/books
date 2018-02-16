const server = require('frappejs/server');
const path = require('path');

server.start({
    backend: 'sqlite',
    connectionParams: {dbPath: 'test.db'},
    static: './',
    models: require('./models')
});