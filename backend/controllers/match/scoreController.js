// backend/controllers/match/scoreController.js

const asyncHandler = require('express-async-handler');
const { updateLiveScore, finalizeScore } = require('../../services/match/scoreService');

/**
 * @desc Update live score for a match
 * @route POST /api/v1/matches/:id/score
 * @access Protected (admin)
 */
exports.updateLiveScore = asyncHandler(async (req, res) => {
  const matchId = req.params.id;
  const scoreData = req.body.scoreData;
  const match = await updateLiveScore(matchId, scoreData);
  res.json({ success: true, data: { match } });
});

/**
 * @desc Finalize and complete a match’s score
 * @route POST /api/v1/matches/:id/finalize
 * @access Protected (admin)
 */
exports.finalizeScore = asyncHandler(async (req, res) => {
  const matchId = req.params.id;
  const finalScore = req.body.finalScore;
  const match = await finalizeScore(matchId, finalScore);
  res.json({ success: true, data: { match } });
});
