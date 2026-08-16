// backend/routes/notification.routes.js
// Maps notification endpoints to controller handlers. All protected.
// Used in: backend/server.js.

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authenticateToken = require('../middleware/auth.middleware');

router.use(authenticateToken);

// @route   GET /api/notifications
// @desc    List the current user's notifications (paginated)
// @access  Protected
router.get('/', notificationController.getNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Unread notification count for the topbar badge
// @access  Protected
router.get('/unread-count', notificationController.getUnreadCount);

// @route   POST /api/notifications/:id/read
// @desc    Mark a single notification as read
// @access  Protected (owner only)
router.post('/:id/read', notificationController.markRead);

// @route   POST /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Protected
router.post('/read-all', notificationController.markAllRead);

module.exports = router;
