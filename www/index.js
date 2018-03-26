const client = require('frappejs/client');
const appClient = require('../client');

// start server
client.start({
    columns: 3,
    server: 'localhost:8000'
}).then(() => {
    appClient.start();
});

module.exports = false;