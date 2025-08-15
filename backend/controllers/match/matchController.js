const asyncHandler = require('express-async-handler');
const Match = require('../../models/Match');
const Team = require('../../models/Team');
const redisClient = require('../../config/redis');
const logger = require('../../utils/logger/logger');
const scoreService = require('../../services/match/scoreService');

class MatchController {
  // Add new match
  addMatch = asyncHandler(async (req, res) => {
    const match = await Match.create(req.body);
    await redisClient.del(`matches:*`);
    res.status(201).json({ success: true, data: match });
  });

  // Get all matches
  getMatches = asyncHandler(async (req, res) => {
    const cacheKey = `matches:${req.query.page || 1}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const matches = await Match.find()
      .populate('teams', 'teamName')
      .sort({ date: 1 })
      .limit(parseInt(req.query.limit || 20))
      .skip(((parseInt(req.query.page || 1) - 1) * parseInt(req.query.limit || 20)));
    await redisClient.set(cacheKey, matches, 300);
    res.json({ success: true, data: matches });
  });

  // Get match by ID
  getMatchById = asyncHandler(async (req, res) => {
    const match = await Match.findById(req.params.id).populate('teams', 'teamName');
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    res.json({ success: true, data: match });
  });

  // Update match
  updateMatch = asyncHandler(async (req, res) => {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    await redisClient.del(`matches:${req.params.id}`);
    res.json({ success: true, data: match });
  });

  // Delete match
  deleteMatch = asyncHandler(async (req, res) => {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    await redisClient.del(`matches:*`);
    res.json({ success: true, message: 'Match deleted' });
  });
}

module.exports = new MatchController();
