// Verify this with mentor
// REF. https://github.com/nodemailer/nodemailer/issues/206

module.exports = {
    validate: async function (mailDetails) {
        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        if (reg.test(mailDetails.email) == false) {
            return false;
        }
        return true;
    },
    authValidate: async function (mailDetails) {
        return new Promise((resolve,reject) => {
            var Imap = require('imap');
            var imap = new Imap({
                user: mailDetails.email,
                password: mailDetails.password,
                host: mailDetails.imapHost,
                port: mailDetails.imapPort,
                tls: true
            });
            imap.once('ready',resolve);
            imap.once('error',reject);
            imap.connect();
        })
    }
}