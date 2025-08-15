const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  entryFee: Number,
  prize: Number,
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  scores: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score: Number,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tournament', tournamentSchema);