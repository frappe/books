const frappe = require('frappejs');
const simpleParser = require('mailparser').simpleParser;
const Imap = require('imap');
const getConfig = require("./getConfig");

module.exports = {
  sync: async () => {

    let account = await getConfig();
    let emailSyncOption = account[0].emailSync;
    var config = {
      "user": account[0].email,
      "password": account[0].password,
      "host": account[0].imapHost,
      "port": account[0].imapPort,
      "tls": true,
  };
  var imap = new Imap(config);
    function openInbox(cb) {
      imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', function () {

      openInbox(function (err, box) {

        if (err) throw err;
        imap.search([emailSyncOption, ['SINCE', account[0].initialDate]], function (err, results) {
          if (err) throw err;
          var fetch = imap.fetch(results, {
            bodies: ''
          });

          fetch.on('message', function (msg, seqno) {
            msg.on('body', function (stream, info) {

              simpleParser(stream)
                .then(async function (mail_object) {
                  const mail = await frappe.insert({
                    doctype: 'Email',
                    name: "Received from : " + mail_object.to.value[0].address + " " + mail_object.subject.slice(0, 10), // needs change : THINK 
                    fromEmailAddress: mail_object.from.value[0].address,
                    toEmailAddress: mail_object.to.value[0].address,
                    ccEmailAddress: mail_object.cc,
                    bccEmailAddress: mail_object.bcc,
                    date: mail_object.date,
                    subject: mail_object.subject,
                    bodyHtml: mail_object.html,
                    bodyText: mail_object.text,
                    sent: "1",
                  });
                })
                .catch(function (err) {
                  console.log('An error occurred:', err.message);
                });
            });
          });

          fetch.once('error', function (err) {
            console.log('Fetch error: ' + err);
          });

          fetch.once('end', function () {
            console.log('Done fetching all messages!');
            imap.end();
          });
        });
      });
    });

    imap.once('error', function (err) {
      console.log(err);
    });

    imap.once('end', function () {
      console.log('Connection ended');
    });

    imap.connect();
  }
}
