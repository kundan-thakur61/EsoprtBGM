const express = require('express');
const router = express.Router();
const teamController = require('../../../controllers/team/teamController');
const inviteController = require('../../../controllers/team/inviteController');
const { authenticate } = require('../../../middleware/auth/authMiddleware');
const { handleValidation } = require('../../../middleware/validation/validateRequest');
const { body } = require('express-validator');

// Team routes
router.post('/', [
  authenticate,
  body('teamName').notEmpty().withMessage('Team name is required'),
  body('game').notEmpty().withMessage('Game is required'),
  handleValidation
], teamController.createTeam);

router.get('/', teamController.getTeams);
router.get('/:id', teamController.getTeamById);
router.put('/:id', [
  authenticate,
  body('teamName').optional().isString(),
  body('game').optional().isString(),
  handleValidation
], teamController.updateTeam);
router.delete('/:id', authenticate, teamController.deleteTeam);

// Team member routes
router.post('/:id/members', [
  authenticate,
  body('userId').notEmpty().withMessage('User ID is required'),
  body('role').isIn(['player', 'coach', 'manager']).withMessage('Invalid role'),
  handleValidation
], teamController.addTeamMember);

router.delete('/:id/members/:userId', authenticate, teamController.removeTeamMember);

// Team invitation routes
router.post('/:id/invite', [
  authenticate,
  body('userId').notEmpty().withMessage('User ID is required'),
  body('message').optional().isString(),
  handleValidation
], inviteController.sendInvite);

router.post('/:id/invites/:inviteId/accept', authenticate, inviteController.acceptInvite);
router.post('/:id/invites/:inviteId/decline', authenticate, inviteController.declineInvite);

module.exports = router;
