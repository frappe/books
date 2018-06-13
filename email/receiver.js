// TODO : Pull This off from DB , Also Take care of default feild being active 

var config = require('./config');

const simpleParser = require('mailparser').simpleParser;

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
    imap.search([ 'UNSEEN', ['SINCE', 'May 28, 2018'] ], function(err, results) {
    if (err) throw err;
    var fetch = imap.fetch(results, { bodies: '' });
    
    fetch.on('message', function(msg, seqno) {
    	var prefix = '(#' + seqno + ') ';
    	msg.on('body', function(stream, info) {
    		
    		simpleParser(stream).then(function(mail_object) {
    			// console.log(mail_object);	
    			// SEE ATTRIBUTES AT :  https://nodemailer.com/extras/mailparser/
    			
    			console.log("From:", mail_object.from.value);
    			console.log("To :", mail_object.to.value);
    			// console.log("Html:", mail_object.html);
    			console.log("Date :", mail_object.date);
  				console.log("Subject:", mail_object.subject);
  				//console.log("Text body:", mail_object.text);
				
			}).catch(function(err) {
 				 
 				console.log('An error occurred:', err.message);
			
			});
            
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

