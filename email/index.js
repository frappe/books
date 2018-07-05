const sender = require('./sender');
const receiver = require('./receiver');
const validator = require('./validator');
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

    frappe.registerMethod({
        method: 'validate-mail',
        handler: validator.validate
    });
    frappe.registerMethod({
        method: 'validate-auth',
        handler: validator.authValidate
    });
};