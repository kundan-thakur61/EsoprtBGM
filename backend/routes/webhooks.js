// backend/routes/webhooks.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Webhook for payment gateway (e.g., Razorpay, Stripe)
router.post('/payment', (req, res) => {
  try {
    // Verify webhook signature here (depends on your payment gateway)
    const body = JSON.stringify(req.body);
    
    console.log('Payment webhook received:', req.body);
    
    // Process payment webhook
    // Update order status, send notifications, etc.
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Webhook for tournament updates
router.post('/tournament', (req, res) => {
  try {
    console.log('Tournament webhook received:', req.body);
    
    // Process tournament webhook
    // Handle tournament status changes, bracket updates, etc.
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tournament webhook error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Webhook for match results from external sources
router.post('/match-result', (req, res) => {
  try {
    console.log('Match result webhook received:', req.body);
    
    // Process match result webhook
    // Update match scores, player stats, leaderboards, etc.
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Match result webhook error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Generic webhook handler
router.post('/:service', (req, res) => {
  try {
    const service = req.params.service;
    console.log(`${service} webhook received:`, req.body);
    
    res.status(200).json({ 
      success: true, 
      message: `${service} webhook received` 
    });
  } catch (error) {
    console.error('Generic webhook error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
