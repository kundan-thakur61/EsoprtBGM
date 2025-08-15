const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatarUrl: {
    type: String
  },
  socialLinks: {
    twitter: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    twitch: { type: String }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);
