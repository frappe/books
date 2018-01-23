const server = require('frappejs/server');
const path = require('path');

server.start({
    backend: 'sqlite',
    connection_params: {db_path: 'test.db'},
    static: './',
    models_path: path.resolve(__dirname, './models')
});