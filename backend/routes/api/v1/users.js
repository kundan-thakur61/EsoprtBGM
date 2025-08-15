const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../../../controllers/userController');
const { authenticate, optionalAuth } = require('../../../middleware/auth/authMiddleware');
const { handleValidation } = require('../../../middleware/validation/validateRequest');
const { upload } = require('../../../config/multer');
const logger = require('../../../utils/logger/logger');

// User profile routes
router.get('/me', authenticate, userController.getUserProfile);
router.put('/me', [
  authenticate,
  upload.single('avatar'),
  body('username').optional().isString().trim().isLength({ min: 3, max: 30 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('bio').optional().trim().isLength({ max: 500 }),
  handleValidation
], userController.updateProfile);

// User stats and rankings
router.get('/:id/stats', optionalAuth, userController.getUserStats);
router.get('/leaderboard', userController.getLeaderboard);

// User teams
router.get('/me/teams', authenticate, userController.getUserTeams);

// User tournaments
router.get('/me/tournaments', authenticate, userController.getUserTournaments);
router.get('/me/tournaments/upcoming', authenticate, userController.getUpcomingTournaments);
router.get('/me/tournaments/completed', authenticate, userController.getCompletedTournaments);

// User wallet and transactions
router.get('/me/wallet', authenticate, userController.getWalletBalance);
router.get('/me/transactions', authenticate, userController.getTransactionHistory);

// User settings
router.get('/me/settings', authenticate, userController.getUserSettings);
router.put('/me/settings', [
  authenticate,
  body('notifications.email').optional().isBoolean(),
  body('notifications.push').optional().isBoolean(),
  body('privacy.profile').optional().isIn(['public', 'friends', 'private']),
  body('privacy.stats').optional().isIn(['public', 'friends', 'private']),
  handleValidation
], userController.updateUserSettings);

// User connections
router.get('/:id/friends', optionalAuth, userController.getUserFriends);
router.get('/:id/followers', optionalAuth, userController.getUserFollowers);
router.get('/:id/following', optionalAuth, userController.getUserFollowing);

// Friend requests
router.post('/friends/request', [
  authenticate,
  body('userId').notEmpty().withMessage('User ID is required'),
  handleValidation
], userController.sendFriendRequest);

router.post('/friends/accept', [
  authenticate,
  body('requestId').notEmpty().withMessage('Request ID is required'),
  handleValidation
], userController.acceptFriendRequest);

// User search
router.get('/search', [
  authenticate,
  (req, res, next) => {
    if (!req.query.q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    next();
  }
], userController.searchUsers);

// User notifications
router.get('/me/notifications', authenticate, userController.getNotifications);
router.put('/me/notifications/:id/read', authenticate, userController.markNotificationAsRead);

// User achievements
router.get('/:id/achievements', optionalAuth, userController.getUserAchievements);

// User reports
router.post('/report', [
  authenticate,
  body('reportedUser').notEmpty().withMessage('Reported user ID is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('description').optional().trim(),
  handleValidation
], userController.reportUser);

// User verification
router.post('/verify/request', [
  authenticate,
  upload.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  handleValidation
], userController.requestVerification);

// User device management
router.get('/me/devices', authenticate, userController.getUserDevices);
router.delete('/me/devices/:deviceId', authenticate, userController.removeDevice);

// User preferences
router.get('/me/preferences', authenticate, userController.getUserPreferences);
router.put('/me/preferences', [
  authenticate,
  body('language').optional().isString(),
  body('theme').optional().isIn(['light', 'dark', 'system']),
  body('gamePreferences').optional().isObject(),
  handleValidation
], userController.updateUserPreferences);

// User activity
router.get('/me/activity', authenticate, userController.getUserActivity);

// User presence
router.post('/me/presence', [
  authenticate,
  body('status').isIn(['online', 'away', 'offline', 'in_game']),
  body('game').optional().isString(),
  handleValidation
], userController.updatePresence);

module.exports = router;
