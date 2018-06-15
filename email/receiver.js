const frappe = require('frappejs');
const simpleParser = require('mailparser').simpleParser;
const Imap = require('imap'),
  inspect = require('util').inspect;
const getConfig = require("./getConfig");

module.exports = async () => {

  let config = await getConfig();

  var imap = new Imap(config);

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  imap.once('ready', function () {

    openInbox(function (err, box) {

      if (err) throw err;
      imap.search(['UNSEEN', ['SINCE', 'May 28, 2018']], function (err, results) {
        if (err) throw err;
        var fetch = imap.fetch(results, {
          bodies: ''
        });

        fetch.on('message', function (msg, seqno) {
          var prefix = '(#' + seqno + ') ';
          msg.on('body', function (stream, info) {

            simpleParser(stream)
              .then(async function (mail_object) {
                const mail = await frappe.insert({
                  doctype: 'Email',
                  name: mail_object.to.value[0].address + "       " + mail_object.subject.slice(0,10), // needs change : THINK 
                  from_emailAddress: mail_object.from.value[0].address,
                  to_emailAddress: mail_object.to.value[0].address,
                  cc_emailAddress: mail_object.cc,
                  bcc_emailAddress: mail_object.bcc,
                  date: mail_object.date,
                  subject: mail_object.subject,
                  bodyHtml: mail_object.html,
                  bodyText: mail_object.text,
                  sentReceive: "1",
                });
                console.log("Done inserting " + seqno); // CHANGE NAME FIELD , HERE NO.
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
