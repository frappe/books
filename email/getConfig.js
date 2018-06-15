const frappe = require('frappejs');
module.exports = async function getData() {
    account = await frappe.db.getAll({
        doctype: 'EmailAccount',
        fields: ['*']
    })
    account = account[0];
    return {
        "user": account.from_emailAddress,
        "password": account.password,
        "host": account.imapHost,
        "port": account.imapPort,
        "tls": true,
    };
}
