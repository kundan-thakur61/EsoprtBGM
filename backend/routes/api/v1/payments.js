const express = require('express');
const router = express.Router();
const paymentController = require('../../../controllers/payment/paymentController');

const walletController = require('../../../controllers/payment/walletController');
const subscriptionController = require('../../../controllers/payment/subscriptionController');
const { authenticate } = require('../../../middleware/auth/authMiddleware');
const { handleValidation } = require('../../../middleware/validation/validateRequest');
const { body } = require('express-validator');

// Payment routes
router.post('/create-order', [
  authenticate,
  body('amount').isNumeric().withMessage('Amount is required'),
  body('currency').optional().isString(),
  handleValidation
], paymentController.createOrder);

router.post('/verify-payment', [
  authenticate,
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('signature').notEmpty().withMessage('Signature is required'),
  handleValidation
], paymentController.verifyPayment);

// Wallet routes
router.get('/wallet', authenticate, walletController.getWalletBalance);
router.post('/wallet/add-money', [
  authenticate,
  body('amount').isNumeric().withMessage('Amount is required'),
  handleValidation
], walletController.addMoneyToWallet);

router.get('/wallet/transactions', authenticate, walletController.getTransactionHistory);

// Subscription routes
router.get('/subscriptions', authenticate, subscriptionController.getSubscriptions);
router.post('/subscriptions', [
  authenticate,
  body('planId').notEmpty().withMessage('Plan ID is required'),
  handleValidation
], subscriptionController.createSubscription);

router.put('/subscriptions/:id/cancel', authenticate, subscriptionController.cancelSubscription);

module.exports = router;
