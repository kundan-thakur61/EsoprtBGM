 const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail({ to, subject, html }) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@esportsplatform.com',
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to, messageId: info.messageId });
      return info;
    } catch (error) {
      logger.error('Error sending email', error);
      throw error;
    }
  }
}

const emailService = new EmailService();

const sendEmail = async (options) => {
  return emailService.sendEmail(options);
};

module.exports = {
  sendEmail
};
