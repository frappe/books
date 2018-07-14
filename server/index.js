const path = require('path');
const server = require('frappejs/server');
const postStart = require('./postStart');

module.exports = {
  async start() {
    await server.start({
      backend: 'sqlite',
      connectionParams: { dbPath: 'test.db', enableCORS: true },
      staticPath: path.resolve(__dirname, '../www'),
      models: require('../models')
    })

    await postStart();
  }
}
