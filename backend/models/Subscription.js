// backend/models/Subscription.js
const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    required: true,
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'trial'],
    default: 'active'
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  renewed: { type: Boolean, default: false },
  paymentMethod: { type: String },
  externalSubscriptionId: { type: String }, // e.g. Stripe/Razorpay/Braintree
}, { timestamps: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
