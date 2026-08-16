// backend/routes/user.routes.js
// Maps the user directory and admin user-management endpoints to their handlers.
// Used in: backend/server.js.

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// @route   GET /api/users
// @desc    List users (id, name, email, role, avatar) for chat/assignment selectors
// @access  Protected
router.get('/', authenticateToken, userController.getUsers);

// @route   PUT /api/users/me
// @desc    Update the signed-in user's profile (name, email, phone, bio, ...)
// @access  Protected
router.put('/me', authenticateToken, userController.updateProfile);

// @route   GET /api/users/admin
// @desc    Admin directory of all users with management fields
// @access  Admin
router.get('/admin', authenticateToken, requireRole(['admin']), userController.adminGetUsers);

// @route   PUT /api/users/admin/:id
// @desc    Admin edits a user's profile details (name, email, phone, bio, ...)
// @access  Admin
router.put('/admin/:id', authenticateToken, requireRole(['admin']), userController.adminUpdateProfile);

// @route   POST /api/users/admin
// @desc    Admin creates a new user account with an explicit role
// @access  Admin
router.post('/admin', authenticateToken, requireRole(['admin']), userController.adminCreateUser);

// @route   PUT /api/users/admin/:id/role
// @desc    Admin changes a user's role
// @access  Admin
router.put('/admin/:id/role', authenticateToken, requireRole(['admin']), userController.adminUpdateRole);

// @route   PUT /api/users/admin/:id/status
// @desc    Admin suspends or reactivates a user
// @access  Admin
router.put('/admin/:id/status', authenticateToken, requireRole(['admin']), userController.adminSetStatus);

// @route   POST /api/users/admin/:id/reset-password
// @desc    Admin sets a new password for a user and signs them out everywhere
// @access  Admin
router.post('/admin/:id/reset-password', authenticateToken, requireRole(['admin']), userController.adminResetPassword);

// @route   POST /api/users/admin/:id/force-logout
// @desc    Admin revokes all of a user's sessions
// @access  Admin
router.post('/admin/:id/force-logout', authenticateToken, requireRole(['admin']), userController.adminForceLogout);

module.exports = router;
