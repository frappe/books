const frappe = require('frappejs');
module.exports = async function getData(emailAddress) {
    account = await frappe.db.getAll({
        doctype: 'EmailAccount',
        fields: ['*']
    })
    for(var i = 0 ; i < account.length; i++ ){
        if (emailAddress == account[i].email){
            return account[i];
        }
    }
    console.log(emailAddress + "  NOT FOUND IN RECORDS");
}
