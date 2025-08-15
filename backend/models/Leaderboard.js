// backend/models/Leaderboard.js
const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
    index: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  rank: {
    type: Number,
    required: true,
    index: true
  },
  points: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  draws: {
    type: Number,
    default: 0
  },
  matchesPlayed: {
    type: Number,
    default: 0
  },
  winRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  killDeathRatio: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  bestPerformance: {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match'
    },
    score: Number,
    kills: Number,
    deaths: Number,
    assists: Number
  },
  season: {
    type: String,
    default: 'current'
  },
  game: {
    type: String,
    required: true,
    enum: ['valorant', 'csgo', 'lol', 'dota2', 'pubg', 'fortnite', 'apex']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  indexes: [
    { tournament: 1, rank: 1 },
    { game: 1, season: 1, rank: 1 },
    { user: 1, tournament: 1 }
  ]
});

// Calculate win rate before saving
LeaderboardSchema.pre('save', function(next) {
  if (this.matchesPlayed > 0) {
    this.winRate = Math.round((this.wins / this.matchesPlayed) * 100);
  }
  next();
});

// Virtual for total games
LeaderboardSchema.virtual('totalGames').get(function() {
  return this.wins + this.losses + this.draws;
});

// Static method to get tournament leaderboard
LeaderboardSchema.statics.getTournamentLeaderboard = function(tournamentId, limit = 50) {
  return this.find({ tournament: tournamentId, isActive: true })
    .populate('user', 'username avatar')
    .populate('team', 'name logo')
    .sort({ rank: 1, points: -1 })
    .limit(limit);
};

// Static method to get global leaderboard by game
LeaderboardSchema.statics.getGlobalLeaderboard = function(game, season = 'current', limit = 100) {
  return this.find({ game, season, isActive: true })
    .populate('user', 'username avatar')
    .populate('team', 'name logo')
    .sort({ points: -1, winRate: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);
