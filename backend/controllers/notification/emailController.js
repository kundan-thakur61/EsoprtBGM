const asyncHandler = require('express-async-handler');
const { sendEmail } = require('../../services/notification/emailService');

class EmailController {
  sendCustom = asyncHandler(async (req, res) => {
    const { to, subject, template, data } = req.body;
    await sendEmail({ to, subject, template, data });
    res.json({ success: true, message: 'Email sent' });
  });
}

module.exports = new EmailController();
