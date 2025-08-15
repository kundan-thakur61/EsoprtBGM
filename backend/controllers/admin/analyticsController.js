const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const Match = require('../../models/Match');

class AnalyticsController {
  getUserStats = asyncHandler(async (req, res) => {
    const stats = await User.getUserStats();
    res.json({ success: true, data: stats });
  });

  getTournamentStats = asyncHandler(async (req, res) => {
    const count = await Tournament.countDocuments();
    const ongoing = await Tournament.countDocuments({ status: 'ongoing' });
    const completed = await Tournament.countDocuments({ status: 'completed' });
    res.json({ success: true, data: { total: count, ongoing, completed } });
  });

  getMatchStats = asyncHandler(async (req, res) => {
    const count = await Match.countDocuments();
    const upcoming = await Match.countDocuments({ status: 'upcoming' });
    const completed = await Match.countDocuments({ status: 'completed' });
    res.json({ success: true, data: { total: count, upcoming, completed } });
  });
}

module.exports = new AnalyticsController();
