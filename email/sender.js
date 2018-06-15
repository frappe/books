const nodemailer = require('nodemailer');
const frappe = require('frappejs');
const getConfig = require("./getConfigSender");

module.exports = {
  'sendMail': async function (mailDetails) {
    let account = await getConfig(mailDetails.fromEmailAddress);
    mailDetails = {
      from: account.email,
      to: mailDetails.toEmailAddress,
      subject: mailDetails.subject,
      text: mailDetails.bodyText,
    };
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: account.email,
        pass: account.password,
      }
    });
    return transporter.sendMail(mailDetails);
  }
};