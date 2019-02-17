const frappe = require('frappejs');
module.exports = async function getData() {
    account = await frappe.getDoc('EmailAccount');
    return account;
}