// backend/routes/api/v1/tournaments.js

const express = require('express');
const path = require('path');
const { body, query } = require('express-validator');

const tournamentController    = require(path.join(__dirname, '../../../controllers/tournament/tournamentController'));
const bracketController       = require(path.join(__dirname, '../../../controllers/tournament/bracketController'));
const registrationController  = require(path.join(__dirname, '../../../controllers/tournament/registrationController'));

const authMiddleware          = require(path.join(__dirname, '../../../middleware/auth/authMiddleware'));
const { authorizeRoles }      = require(path.join(__dirname, '../../../middleware/roleCheck'));
const {
  handleValidation,
  validateObjectId,
  validatePagination,
  validateTournamentData
} = require(path.join(__dirname, '../../../middleware/validation/validateRequest'));
const upload                  = require(path.join(__dirname, '../../../middleware/utils/uploadMiddleware'));

const router = express.Router();
const { authenticate, optionalAuth, checkSubscription } = authMiddleware;

// Public routes
router.get(
  '/',
  validatePagination,
  [
    query('game').optional().isIn(['valorant','csgo','lol','dota2','pubg','fortnite','apex']),
    query('status').optional().isIn(['upcoming','ongoing','completed','cancelled']),
    query('format').optional().isIn(['single_elimination','double_elimination','round_robin','swiss']),
    query('search').optional().isLength({ min:1, max:100 })
  ],
  handleValidation,
  optionalAuth,
  tournamentController.getAllTournaments
);

router.get(
  '/featured',
  optionalAuth,
  tournamentController.getFeaturedTournaments
);

router.get(
  '/upcoming',
  validatePagination,
  optionalAuth,
  tournamentController.getUpcomingTournaments
);

router.get(
  '/:id',
  validateObjectId('id'),
  handleValidation,
  optionalAuth,
  tournamentController.getTournamentById
);

router.get(
  '/:id/brackets',
  validateObjectId('id'),
  handleValidation,
  optionalAuth,
  bracketController.getTournamentBracket
);

router.get(
  '/:id/matches',
  validateObjectId('id'),
  validatePagination,
  handleValidation,
  optionalAuth,
  tournamentController.getTournamentMatches
);

router.get(
  '/:id/standings',
  validateObjectId('id'),
  handleValidation,
  optionalAuth,
  tournamentController.getTournamentStandings
);

router.get(
  '/:id/participants',
  validateObjectId('id'),
  validatePagination,
  handleValidation,
  optionalAuth,
  tournamentController.getTournamentParticipants
);

// Authenticated routes
router.use(authenticate);

router.get(
  '/my/tournaments',
  validatePagination,
  tournamentController.getMyTournaments
);

router.get(
  '/my/registered',
  validatePagination,
  registrationController.getMyRegistrations
);

// Registration
router.post(
  '/:id/register',
  validateObjectId('id'),
  [
    body('teamId').isMongoId().withMessage('Valid team ID is required'),
    body('acceptRules')
      .isBoolean()
      .custom(v => v || (() => { throw new Error('You must accept the tournament rules'); })())
  ],
  handleValidation,
  registrationController.registerTeam
);

router.delete(
  '/:id/unregister',
  validateObjectId('id'),
  [
    body('teamId').isMongoId().withMessage('Valid team ID is required')
  ],
  handleValidation,
  registrationController.unregisterTeam
);

// Create tournament (premium users)
router.post(
  '/',
  authenticate,
  checkSubscription('premium'),
  upload.single('banner'),
  validateTournamentData,
  handleValidation,
  tournamentController.createTournament
);

// Update tournament
router.patch(
  '/:id',
  validateObjectId('id'),
  upload.single('banner'),
  validateTournamentData,
  handleValidation,
  authorizeRoles('admin','super_admin'),
  tournamentController.updateTournament
);

// Delete tournament
router.delete(
  '/:id',
  validateObjectId('id'),
  handleValidation,
  authorizeRoles('admin','super_admin'),
  tournamentController.deleteTournament
);

// Admin controls
router.post(
  '/:id/start',
  validateObjectId('id'),
  handleValidation,
  authorizeRoles('admin','super_admin'),
  tournamentController.startTournament
);

router.post(
  '/:id/pause',
  validateObjectId('id'),
  handleValidation,
  authorizeRoles('admin','super_admin'),
  tournamentController.pauseTournament
);

router.post(
  '/:id/resume',
  validateObjectId('id'),
  handleValidation,
  authorizeRoles('admin','super_admin'),
  tournamentController.resumeTournament
);

router.post(
  '/:id/cancel',
  validateObjectId('id'),
  [ body('reason').notEmpty().isLength({ max:500 }).withMessage('Reason is required') ],
  handleValidation,
  authorizeRoles('admin','super_admin'),
  tournamentController.cancelTournament
);

// Bracket generation
router.post(
  '/:id/generate-bracket',
  validateObjectId('id'),
  authorizeRoles('admin','super_admin'),
  bracketController.generateBracket
);

router.patch(
  '/:id/brackets/:bracketId',
  [ validateObjectId('id'), validateObjectId('bracketId') ],
  handleValidation,
  authorizeRoles('admin','super_admin'),
  bracketController.updateBracket
);

// Match result
router.post(
  '/:id/matches/:matchId/result',
  [
    validateObjectId('id'),
    validateObjectId('matchId'),
    body('winnerId').isMongoId(),
    body('scores').isArray({ min:1 }),
    body('scores.*').isObject(),
    body('duration').optional().isInt({ min:0 }),
    body('screenshots').optional().isArray()
  ],
  handleValidation,
  authorizeRoles('admin','super_admin'),
  tournamentController.reportMatchResult
);

// Stats & Export
router.get(
  '/:id/stats',
  validateObjectId('id'),
  handleValidation,
  authorizeRoles('admin','super_admin'),
  tournamentController.getTournamentStats
);

router.get(
  '/:id/export',
  validateObjectId('id'),
  [ query('format').optional().isIn(['json','csv','xlsx']) ],
  handleValidation,
  authorizeRoles('admin','super_admin'),
  tournamentController.exportTournamentData
);

module.exports = router;
