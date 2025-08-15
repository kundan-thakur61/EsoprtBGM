const express = require('express');
const router = express.Router();
const statsController = require('../../../controllers/stats/statsController');
const leaderboardController = require('../../../controllers/stats/leaderboardController');
const { authenticate, optionalAuth } = require('../../../middleware/auth/authMiddleware');
const { handleValidation, validateObjectId } = require('../../../middleware/validation/validateRequest');

// Debug logs
console.log('🔍 Available statsController functions:', Object.keys(statsController || {}));
console.log('🔍 Available leaderboardController functions:', Object.keys(leaderboardController || {}));

// Public stats routes
router.get('/overall', optionalAuth, statsController.getOverallStats);

// Protected stats routes (require authentication)
router.use(authenticate);

// User stats
router.get('/user/:userId?', statsController.getUserStats);

// Tournament stats
router.get('/tournament/:tournamentId', 
  validateObjectId('tournamentId'), 
  handleValidation,
  statsController.getTournamentStats
);

// Game stats
router.get('/game/:game', statsController.getGameStats);

// Leaderboard routes
router.get('/leaderboard/global', leaderboardController.getGlobalLeaderboard);

router.get('/leaderboard/tournament/:tournamentId', 
  validateObjectId('tournamentId'),
  handleValidation,
  leaderboardController.getTournamentLeaderboard
);

router.get('/leaderboard/user/:userId', 
  validateObjectId('userId'),
  handleValidation,
  leaderboardController.getUserRanking
);

module.exports = router;
