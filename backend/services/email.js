const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send email
 * @param {string} to recipient email
 * @param {string} subject email subject
 * @param {string} html HTML body
 */
exports.sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Esports Tournament" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};
