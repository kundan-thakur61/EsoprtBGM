const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  wallet: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  referredBy: String,
  isAdmin: { type: Boolean, default: false },
  twoFA: {
    enabled: { type: Boolean, default: false },
    secret: { type: String }
  },
  lastDailyReward: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);