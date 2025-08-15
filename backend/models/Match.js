const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  team1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  team2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  format: {
    type: String,
    enum: ['bo1', 'bo3', 'bo5', 'bo7'],
    default: 'bo1'
  },
  score: {
    team1: {
      type: Number,
      default: 0
    },
    team2: {
      type: Number,
      default: 0
    }
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  streamUrl: {
    type: String
  },
  streamKey: {
    type: String
  },
  isLive: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
matchSchema.index({ tournament: 1, status: 1 });
matchSchema.index({ scheduledAt: 1 });
matchSchema.index({ team1: 1, team2: 1 });

module.exports = mongoose.model('Match', matchSchema);
