const asyncHandler = require('express-async-handler');

exports.createOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'USD' } = req.body;
  
  // Mock order creation - replace with real payment gateway
  const order = {
    id: `order_${Date.now()}`,
    amount,
    currency,
    status: 'created',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: { order }
  });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;
  
  // Mock verification - replace with real gateway verification
  console.log('Verifying payment:', { orderId, paymentId, signature });
  
  res.json({
    success: true,
    message: 'Payment verified successfully'
  });
});
