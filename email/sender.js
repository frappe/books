
const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');
const smtp = require('nodemailer-smtp-transport');
const config = require('config.json')('./config.json');

//var userEmail, receiverEmail, clientId_input, clientSecret_input, refreshToken_Input, subjectText, contentText,userPassword, attachments;

let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secure: 'true',
    port: '465',
    auth: {
          type: 'OAuth2',
          user: config.userMail,
          clientId: config.clientId_input,
          clientSecret:config.clientSecret_input,
          refreshToken:config.refreshToken_input    }
        
    } 
);

let mailOptions = {
    from: config.userMail,
    to: config.receiverMail,
    cc: config.receiverCC,
    bcc: config.receiverBCC,
    subject: config.subjectText,
    text: config.contentText,
    attachments: config._attachments
    };
 

transporter.sendMail(mailOptions, function(e, r) {
  if (e) {
    console.log(e);
  } else {
    console.log(r);
  }
  transporter.close();
});

