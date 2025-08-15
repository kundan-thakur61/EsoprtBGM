// backend/services/match/scoreService.js

const Match = require('../../models/Match');

/**
 * Update live score for a match.
 * @param {string} matchId 
 * @param {Object} scoreData 
 * @returns {Promise<Match>}
 */
async function updateLiveScore(matchId, scoreData) {
  const match = await Match.findById(matchId);
  if (!match) throw new Error('Match not found');
  match.liveScore = scoreData;
  await match.save();
  return match;
}

/**
 * Finalize the score and mark match completed.
 * @param {string} matchId 
 * @param {Object} finalScore 
 * @returns {Promise<Match>}
 */
async function finalizeScore(matchId, finalScore) {
  const match = await Match.findById(matchId);
  if (!match) throw new Error('Match not found');
  match.result = finalScore;
  match.status = 'completed';
  await match.save();
  return match;
}

module.exports = {
  updateLiveScore,
  finalizeScore
};
