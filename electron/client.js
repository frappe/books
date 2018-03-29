const electron = require('frappejs/client/electron');
const appClient = require('../client');

electron.start({
    dbPath: 'test.db',
    columns: 3,
    models: require('../models')
}).then((frappe) => {

module.exports = false;
    appClient.start(frappe);
});