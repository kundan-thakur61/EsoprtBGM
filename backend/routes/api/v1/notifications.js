const express = require('express');
const router = express.Router();
const notificationController = require('../../../controllers/notification/notificationController');
const { authenticate } = require('../../../middleware/auth/authMiddleware');
const { handleValidation, validateObjectId } = require('../../../middleware/validation/validateRequest');

// All routes require authentication
router.use(authenticate);

// Get all notifications
router.get('/', notificationController.getNotifications);

// Mark notification as read (this is likely line 11 causing the error)
router.put('/:id/read', validateObjectId('id'), handleValidation, notificationController.markAsRead);

// Mark all as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', validateObjectId('id'), handleValidation, notificationController.deleteNotification);

// Notification settings
router.get('/settings', notificationController.getNotificationSettings);
router.put('/settings', notificationController.updateNotificationSettings);

module.exports = router;
