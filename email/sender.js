const nodemailer = require('nodemailer');
const frappe = require('frappejs');
const getConfig = require("./getConfigSender");

module.exports = {
  'sendMail': async function (mailDetails) {
    let account = await getConfig(mailDetails.fromEmailAddress);
    const mail = await frappe.insert({
      doctype: 'Email',
      name: "Sent to : " + mailDetails.toEmailAddress + " " + mailDetails.subject.slice(0, 10), // needs change : THINK 
      fromEmailAddress: mailDetails.fromEmailAddress,
      toEmailAddress: mailDetails.toEmailAddress,
      ccEmailAddress: mailDetails.ccEmailAddress,
      bccEmailAddress: mailDetails.bccEmailAddress,
      date: mailDetails,
      subject: mailDetails.subject,
      bodyHtml: "",
      bodyText: mailDetails.bodyText,
      sent: "1",
    });

    mailDetails = {
      from: mail.fromEmailAddress,
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