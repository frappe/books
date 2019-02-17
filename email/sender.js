const nodemailer = require('nodemailer');
const getConfig = require("./getConfig");
const validator = require('./validator');

module.exports = {
  'sendMail': async function (mailDetails) {
    if (!validator.validate(mailDetails.fromEmailAddress)) {
      console.log("INVALID EMAIL");
      return false;
    }

    let account = await getConfig();
    if (mailDetails.fromEmailAddress == account.email) {
      if (validator.validate(mailDetails.toEmailAddress)) {
        mailDetails = {
          from: mailDetails.fromEmailAddress,
          to: mailDetails.toEmailAddress,
          replyTo: mailDetails.toEmailAddress,
          inReplyTo: mailDetails.replyId,
          references: [mailDetails.replyId],
          cc: mailDetails.ccEmailAddress,
          bcc: mailDetails.bccEmailAddress,
          subject: mailDetails.subject,
          text: mailDetails.bodyText,
          attachments: [{
            filename: 'Invoice.pdf',
            path: mailDetails.filePath,
            contentType: 'application/pdf'
          }],
        };
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: account.email,
            pass: account.password,
          }
        });
        transporter.sendMail(mailDetails);
        return true;
      } else {
        console.log("Sender Email Invalid");
        return false;
      }
    }
  }
};
