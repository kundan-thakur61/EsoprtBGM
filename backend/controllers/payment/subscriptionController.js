const asyncHandler = require('express-async-handler');

exports.getSubscriptions = asyncHandler(async (req, res) => {
  // Mock subscription plans
  const plans = [
    { id: 'basic', name: 'Basic', price: 9.99 },
    { id: 'premium', name: 'Premium', price: 19.99 }
  ];
  
  res.json({
    success: true,
    data: { plans }
  });
});

exports.createSubscription = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  
  // Mock subscription creation
  const subscription = {
    id: `sub_${Date.now()}`,
    planId,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: { subscription }
  });
});

exports.cancelSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Mock cancellation
  res.json({
    success: true,
    message: `Subscription ${id} cancelled successfully`
  });
});
