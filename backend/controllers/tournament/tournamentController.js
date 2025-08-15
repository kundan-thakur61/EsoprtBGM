// controllers/tournament/tournamentController.js
const asyncHandler = require('express-async-handler');
const Tournament = require('../../models/Tournament');
const Match = require('../../models/Match');
const Registration = require('../../models/Registration');
const Team = require('../../models/Team');

// ==============================
// 📌 Public Controllers
// ==============================
const getAllTournaments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    game,
    status,
    format,
    search,
    sortBy = 'startDate',
    sortOrder = 'desc'
  } = req.query;

  const filter = {};
  if (game) filter.game = game;
  if (status) filter.status = status;
  if (format) filter.format = format;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const tournaments = await Tournament.find(filter)
    .populate('createdBy', 'username avatar')
    .populate('participants', 'username avatar')
    .populate('teams', 'name logo')
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Tournament.countDocuments(filter);

  res.json({
    success: true,
    data: {
      tournaments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

const getFeaturedTournaments = asyncHandler(async (req, res) => {
  const tournaments = await Tournament.find({
    status: { $in: ['upcoming', 'ongoing'] },
    isFeatured: true
  })
    .populate('createdBy', 'username avatar')
    .sort({ startDate: 1 })
    .limit(6);

  res.json({ success: true, data: { tournaments } });
});

const getUpcomingTournaments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const tournaments = await Tournament.find({
    status: 'upcoming',
    startDate: { $gt: new Date() }
  })
    .populate('createdBy', 'username avatar')
    .sort({ startDate: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Tournament.countDocuments({
    status: 'upcoming',
    startDate: { $gt: new Date() }
  });

  res.json({
    success: true,
    data: {
      tournaments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

const getTournamentById = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate('createdBy', 'username avatar')
    .populate('participants', 'username avatar')
    .populate('teams', 'name logo players')
    .populate({
      path: 'brackets',
      populate: {
        path: 'matches',
        populate: { path: 'team1 team2', select: 'name logo' }
      }
    });

  if (!tournament) {
    return res.status(404).json({ success: false, message: 'Tournament not found' });
  }

  res.json({ success: true, data: { tournament } });
});

const getTournamentMatches = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const matches = await Match.find({ tournament: req.params.id })
    .populate('team1', 'name logo')
    .populate('team2', 'name logo')
    .populate('winner', 'name logo')
    .sort({ scheduledAt: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Match.countDocuments({ tournament: req.params.id });

  res.json({
    success: true,
    data: {
      matches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

const getTournamentStandings = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id).populate({
    path: 'teams',
    select: 'name logo',
    populate: { path: 'players', select: 'username avatar' }
  });

  if (!tournament) {
    return res.status(404).json({ success: false, message: 'Tournament not found' });
  }

  const standings = await calculateStandings(tournament._id);

  res.json({ success: true, data: { standings } });
});

const getTournamentParticipants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const participants = await Registration.find({
    tournament: req.params.id,
    status: 'approved'
  })
    .populate('team', 'name logo players')
    .populate('registeredBy', 'username avatar')
    .sort({ registeredAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Registration.countDocuments({
    tournament: req.params.id,
    status: 'approved'
  });

  res.json({
    success: true,
    data: {
      participants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// ==============================
// 📌 Authenticated User Controllers
// ==============================
const getMyTournaments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const tournaments = await Tournament.find({ createdBy: req.user._id })
    .populate('participants', 'username avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Tournament.countDocuments({ createdBy: req.user._id });

  res.json({
    success: true,
    data: {
      tournaments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

const createTournament = asyncHandler(async (req, res) => {
  const tournament = new Tournament({
    ...req.body,
    createdBy: req.user._id,
    banner: req.file?.path || null
  });

  await tournament.save();

  res.status(201).json({ success: true, data: { tournament } });
});

const updateTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);

  if (!tournament) {
    return res.status(404).json({ success: false, message: 'Tournament not found' });
  }

  if (tournament.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  Object.assign(tournament, req.body);
  if (req.file) tournament.banner = req.file.path;

  await tournament.save();

  res.json({ success: true, data: { tournament } });
});
const deleteTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);

  if (!tournament) {
    return res.status(404).json({ success: false, message: 'Tournament not found' });
  }

  if (tournament.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this tournament' });
  }

  await tournament.deleteOne();

  res.json({ success: true, message: 'Tournament deleted successfully' });
});




// ==============================
// 📌 Admin-only Controllers
// ==============================
const startTournament = asyncHandler(async (req, res) => {
  await Tournament.findByIdAndUpdate(req.params.id, { status: 'ongoing' });
  res.json({ success: true, message: 'Tournament started' });
});

const pauseTournament = asyncHandler(async (req, res) => {
  await Tournament.findByIdAndUpdate(req.params.id, { status: 'paused' });
  res.json({ success: true, message: 'Tournament paused' });
});

const resumeTournament = asyncHandler(async (req, res) => {
  await Tournament.findByIdAndUpdate(req.params.id, { status: 'ongoing' });
  res.json({ success: true, message: 'Tournament resumed' });
});

const cancelTournament = asyncHandler(async (req, res) => {
  await Tournament.findByIdAndUpdate(req.params.id, {
    status: 'cancelled',
    cancellationReason: req.body.reason
  });
  res.json({ success: true, message: 'Tournament cancelled' });
});

const reportMatchResult = asyncHandler(async (req, res) => {
  const { winnerId, scores, duration, screenshots } = req.body;
  const match = await Match.findById(req.params.matchId);

  if (!match) {
    return res.status(404).json({ success: false, message: 'Match not found' });
  }

  match.winner = winnerId;
  match.scores = scores;
  match.duration = duration;
  match.screenshots = screenshots || [];
  match.status = 'completed';

  await match.save();

  res.json({ success: true, message: 'Match result updated' });
});

const getTournamentStats = asyncHandler(async (req, res) => {
  const stats = {
    totalMatches: await Match.countDocuments({ tournament: req.params.id }),
    totalParticipants: await Registration.countDocuments({ tournament: req.params.id })
  };
  res.json({ success: true, data: stats });
});

const exportTournamentData = asyncHandler(async (req, res) => {
  const format = req.query.format || 'json';
  const tournament = await Tournament.findById(req.params.id).lean();

  if (!tournament) {
    return res.status(404).json({ success: false, message: 'Tournament not found' });
  }

  if (format === 'json') {
    return res.json(tournament);
  }
  // CSV / XLSX logic can be added here
  res.status(400).json({ success: false, message: 'Format not implemented yet' });
});

// ==============================
// 📌 Helper
// ==============================
const calculateStandings = async () => {
  return [];
};

// ==============================
// 📌 Exports
// ==============================
module.exports = {
  getAllTournaments,
  getFeaturedTournaments,
  getUpcomingTournaments,
  getTournamentById,
  getTournamentMatches,
  getTournamentStandings,
  getTournamentParticipants,
  getMyTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  startTournament,
  pauseTournament,
  resumeTournament,
  cancelTournament,
  reportMatchResult,
  getTournamentStats,
  exportTournamentData
};
