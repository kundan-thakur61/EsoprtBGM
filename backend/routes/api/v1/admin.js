const express = require('express');
const router = express.Router();
const adminController = require('../../../controllers/admin/adminController');
const { authenticate } = require('../../../middleware/auth/authMiddleware');
const { authorizeRoles } = require('../../../middleware/roleCheck');
const { handleValidation, validateObjectId, validatePagination } = require('../../../middleware/validation/validateRequest');
const { body, query } = require('express-validator');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorizeRoles('admin', 'super_admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', validatePagination, adminController.getAllUsers);

router.patch('/users/:userId/status', 
  validateObjectId('userId'),
  [
    body('status').isIn(['active', 'banned', 'suspended']).withMessage('Invalid status'),
    body('reason').optional().isString().isLength({ max: 500 })
  ],
  handleValidation,
  adminController.updateUserStatus
);

router.delete('/users/:userId', 
  validateObjectId('userId'),
  handleValidation,
  adminController.deleteUser
);

// Tournament management
router.get('/tournaments', validatePagination, adminController.getAllTournaments);

// System settings
router.get('/settings', adminController.getSystemSettings);
router.patch('/settings', adminController.updateSystemSettings);

module.exports = router;
