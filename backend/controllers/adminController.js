const User = require('../models/userModel');
const Tournament = require('../models/tournamentModel');

exports.getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

exports.getTournaments = async (req, res) => {
  const tournaments = await Tournament.find();
  res.json(tournaments);
};

exports.getStats = async (req, res) => {
  const users = await User.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, users: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  res.json(users.map(u => ({ date: u._id, users: u.users })));
};