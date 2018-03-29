const client = require('frappejs/client');
const appClient = require('../client');
const SetupWizard = require('../setup');

// start server
client.start({
    server: 'localhost:8000',
    makeDesk: 0
}).then(() => {
    // new SetupWizard({
    //     postSetup: async (data) => {
    //         client.makeDesk(3);
    //         appClient.start();

    //         await frappe.router.setRoute('list', 'ToDo');
    //     }
    // });
    client.makeDesk(3);
    appClient.start();
});

module.exports = false;