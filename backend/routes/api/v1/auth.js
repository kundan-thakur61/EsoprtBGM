const express = require('express');
const { body } = require('express-validator');
const authController = require('../../../controllers/auth/authController');
const { authenticate, optionalAuth } = require('../../../middleware/auth/authMiddleware');
const { handleValidation } = require('../../../middleware/validation/validateRequest');
const { authLimiter, registerLimiter, passwordResetLimiter } = require('../../../middleware/security/rateLimiter');

const router = express.Router();

// Validation schemas
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, lowercase letter, number and special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  body('acceptTerms')
    .isBoolean()
    .withMessage('You must accept the terms and conditions')
    .custom(value => {
      if (!value) {
        throw new Error('You must accept the terms and conditions');
      }
      return true;
    })
];

const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, lowercase letter, number and special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

const twoFactorValidation = [
  body('token')
    .isLength({ min: 6, max: 6 })
    .withMessage('Two-factor authentication code must be 6 digits')
    .isNumeric()
    .withMessage('Two-factor authentication code must be numeric')
];

// Public routes
router.post('/register', 
  registerLimiter,
  registerValidation,
  handleValidation,
  authController.register
);

router.post('/login', 
  authLimiter,
  loginValidation,
  handleValidation,
  authController.login
);

router.post('/refresh-token', 
  refreshTokenValidation,
  handleValidation,
  authController.refreshToken
);

router.post('/forgot-password', 
  passwordResetLimiter,
  forgotPasswordValidation,
  handleValidation,
  authController.forgotPassword
);

router.post('/reset-password/:token', 
  resetPasswordValidation,
  handleValidation,
  authController.resetPassword
);

router.get('/verify-email/:token', authController.verifyEmail);

// Google OAuth routes
router.get('/google', 
  authController.googleAuth
);

router.get('/google/callback', 
  authController.googleCallback
);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

router.get('/me', authController.getMe);

router.post('/resend-verification', 
  authController.resendVerificationEmail
);

// Two-factor authentication
router.post('/2fa/enable', authController.enableTwoFactor);

router.post('/2fa/confirm', 
  twoFactorValidation,
  handleValidation,
  authController.confirmTwoFactor
);

router.post('/2fa/disable', [
  body('password').notEmpty().withMessage('Password is required'),
  body('token').isLength({ min: 6, max: 6 }).withMessage('Authentication code is required')
], handleValidation, authController.disableTwoFactor);

// Change password
router.patch('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, lowercase letter, number and special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
], handleValidation, authController.changePassword);

// Update email
router.patch('/change-email', [
  body('newEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required')
], handleValidation, authController.changeEmail);

// Account deactivation
router.delete('/deactivate', [
  body('password').notEmpty().withMessage('Password is required'),
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
], handleValidation, authController.deactivateAccount);

module.exports = router;