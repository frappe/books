
const server = require('frappejs/server');
const postStart = require('./postStart');

async function start() {
    await server.start({
        backend: 'sqlite',
        connectionParams: { dbPath: 'test.db', enableCORS: true },
        models: require('../models')
    })

    await postStart();
}

start();

module.exports = {
    start
}