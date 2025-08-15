const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in smallest currency unit (e.g., paise)
 * @param {string} currency - Currency code (default: 'INR')
 * @param {string} receipt - Unique receipt/order identifier
 * @returns {Promise<Object>} Razorpay order object
 */
const createOrder = async (amount, currency = 'INR', receipt = `receipt_${Date.now()}`) => {
  const options = {
    amount,
    currency,
    receipt,
    payment_capture: 1,
  };

  return await razorpay.orders.create(options);
};

module.exports = { createOrder };
