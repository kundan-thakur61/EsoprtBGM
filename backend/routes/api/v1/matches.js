// backend/routes/api/v1/matches.js
const express = require('express');
const path = require('path');
const { body, param, query } = require('express-validator');

const matchController = require(path.join(__dirname, '../../../controllers/match/matchController'));
const scoreController = require(path.join(__dirname, '../../../controllers/match/scoreController'));

const authMiddleware = require(path.join(__dirname, '../../../middleware/auth/authMiddleware'));
const { authorizeRoles } = require(path.join(__dirname, '../../../middleware/roleCheck'));
const {
  handleValidation,
  validateObjectId,
  validatePagination
} = require(path.join(__dirname, '../../../middleware/validation/validateRequest'));

const router = express.Router();
const { authenticate, optionalAuth } = authMiddleware;

// Create a new match (admin only)
router.post(
  '/',
  authenticate,
  authorizeRoles('admin','super_admin'),
  [
    body('matchId').notEmpty().withMessage('matchId is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('teams').isArray({ min:2, max:2 }).withMessage('Exactly 2 teams are required'),
  ],
  handleValidation,
  matchController.addMatch
);

// Get all matches (public)
router.get(
  '/',
  validatePagination,
  handleValidation,
  optionalAuth,
  matchController.getMatches
);

// Get match by ID
router.get(
  '/:id',
  validateObjectId('id'),
  handleValidation,
  optionalAuth,
  matchController.getMatchById
);

// Update match (admin only)
router.patch(
  '/:id',
  validateObjectId('id'),
  authenticate,
  authorizeRoles('admin','super_admin'),
  [
    body('date').optional().isISO8601().withMessage('Valid date is required'),
    body('teams').optional().isArray({ min:2, max:2 }).withMessage('Exactly 2 teams are required'),
    body('status').optional().isIn(['upcoming','ongoing','completed']).withMessage('Invalid status'),
    body('result').optional().isObject().withMessage('Result must be an object')
  ],
  handleValidation,
  matchController.updateMatch
);

// Delete match (admin only)
router.delete(
  '/:id',
  validateObjectId('id'),
  authenticate,
  authorizeRoles('admin','super_admin'),
  handleValidation,
  matchController.deleteMatch
);

// Live score update
router.post(
  '/:id/score',
  validateObjectId('id'),
  authenticate,
  authorizeRoles('admin','super_admin'),
  [
    body('scoreData').isObject().withMessage('scoreData object is required')
  ],
  handleValidation,
  scoreController.updateLiveScore
);

// Finalize score
router.post(
  '/:id/finalize',
  validateObjectId('id'),
  authenticate,
  authorizeRoles('admin','super_admin'),
  [
    body('finalScore').isObject().withMessage('finalScore object is required')
  ],
  handleValidation,
  scoreController.finalizeScore
);

module.exports = router;
