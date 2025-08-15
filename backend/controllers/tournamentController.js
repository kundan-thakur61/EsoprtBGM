const Tournament = require('../models/tournamentModel');

exports.createTournament = async (req, res) => {
  const { name, description, image, entryFee, prize } = req.body;
  const tournament = await Tournament.create({ name, description, image, entryFee, prize });
  res.json(tournament);
};

exports.getTournaments = async (req, res) => {
  const tournaments = await Tournament.find();
  res.json(tournaments);
};

exports.joinTournament = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament.players.includes(req.user._id)) {
    tournament.players.push(req.user._id);
    await tournament.save();
  }
  res.json({ message: 'Joined tournament' });
};

exports.withdrawTournament = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  tournament.players = tournament.players.filter(
    (id) => id.toString() !== req.user._id.toString()
  );
  await tournament.save();
  res.json({ message: 'Withdrawn from tournament' });
};

exports.uploadScore = async (req, res) => {
  const { score } = req.body;
  const tournament = await Tournament.findById(req.params.id);
  tournament.scores.push({ user: req.user._id, score });
  await tournament.save();
  res.json({ message: 'Score uploaded' });
};

exports.getLeaderboard = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id).populate('scores.user', 'username');
  const leaderboard = tournament.scores
    .sort((a, b) => b.score - a.score)
    .map((entry, idx) => ({
      rank: idx + 1,
      username: entry.user.username,
      score: entry.score
    }));
  res.json(leaderboard);
};