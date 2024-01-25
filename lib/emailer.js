const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (listings) => {
  const email = {
    to: [process.env.EMAIL_TO, process.env.EMAIL_TO_2],
    from: process.env.EMAIL_FROM,
    subject: process.env.EMAIL_SUBJECT,
    text: process.env.EMAIL_TEXT,
    html: listings,
  };

  try {
    await sgMail.send(email);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {
  sendEmail,
};
