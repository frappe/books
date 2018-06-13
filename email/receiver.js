var config = require('./config');

var Imap = require('imap'),
    inspect = require('util').inspect;

var imap = new Imap(config);

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

imap.once('ready', function() {
    var fs = require('fs'), fileStream;

    openInbox(function(err, box) {
      if (err) throw err;
      // test for May 28, 2018
      imap.search([ 'UNSEEN', ['SINCE', 'May 28, 2018'] ], function(err, results) {
        if (err) throw err;
        var fetch = imap.fetch(results, { bodies: '' });
        fetch.on('message', function(msg, seqno) {
          // console.log('Message #%d', seqno);
          var prefix = '(#' + seqno + ') ';
          msg.on('body', function(stream, info) {
            // console.log(prefix + 'Body');
            stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
            // TODO : have to dump this in db
          });
        });
        fetch.once('error', function(err) {
          console.log('Fetch error: ' + err);
        });
        fetch.once('end', function() {
          console.log('Done fetching all messages!');
          imap.end();
        });
      });
    });
});

imap.once('error', function(err) {
  console.log(err);
});

imap.once('end', function() {
  console.log('Connection ended');
});

imap.connect();
