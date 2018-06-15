const sender = require('./sender');
const receiver = require('./receiver');
const frappe = require('frappejs');

module.exports = () => {
    frappe.registerMethod({
        method: 'send-mail',
        handler: sender.sendMail
    });

    frappe.registerMethod({
        method: 'sync-mail',
        handler: receiver.sync
    });
};