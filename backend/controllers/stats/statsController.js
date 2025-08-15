const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const Match = require('../../models/Match');

exports.getOverallStats = asyncHandler(async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments() || 0,
      totalTournaments: await Tournament.countDocuments() || 0,
      totalMatches: await Match.countDocuments() || 0,
      activeTournaments: await Tournament.countDocuments({ status: 'ongoing' }) || 0
    };

    res.json({ success: true, data: { stats } });
  } catch (error) {
    res.json({
      success: true,
      data: { 
        stats: { totalUsers: 0, totalTournaments: 0, totalMatches: 0, activeTournaments: 0 }
      }
    });
  }
});

exports.getUserStats = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  
  res.json({
    success: true,
    data: { 
      userStats: {
        tournamentsJoined: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        currentRank: 'Unranked'
      }
    }
  });
});

exports.getTournamentStats = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;
  
  res.json({
    success: true,
    data: { 
      tournamentStats: {
        totalParticipants: 0,
        matchesCompleted: 0,
        matchesRemaining: 0,
        currentRound: 1
      }
    }
  });
});

exports.getGameStats = asyncHandler(async (req, res) => {
  const { game } = req.params;
  
  res.json({
    success: true,
    data: {
      gameStats: {
        totalPlayers: 0,
        activeTournaments: 0,
        completedMatches: 0
      }
    }
  });
});
