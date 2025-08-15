const asyncHandler = require('express-async-handler');
const AuditLog = require('../../models/AuditLog');

class AuditController {
  getLogs = asyncHandler(async (req, res) => {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, data: logs });
  });
}

module.exports = new AuditController();
