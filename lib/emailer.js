const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (title, listings, emailList) => {
  const email = {
    to: emailList,
    from: process.env.EMAIL_FROM,
    subject: title,
    text: title,
    html: listings,
  };

  try {
    await sgMail.send(email);

    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
};
