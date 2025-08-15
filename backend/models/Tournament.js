// backend/models/Tournament.js
const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  game: { type: String, required: true },
  format: { type: String, enum: ['single_elimination','double_elimination','round_robin','swiss'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  status: { type: String, enum: ['upcoming','ongoing','completed','cancelled'], default: 'upcoming' },
  isFeatured: { type: Boolean, default: false },
  banner: String,
  cancellationReason: String
}, { timestamps: true });

module.exports = mongoose.model('Tournament', TournamentSchema);
