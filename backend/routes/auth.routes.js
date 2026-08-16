// backend/routes/auth.routes.js
// Maps endpoint paths to authentication controller handlers.
// Used in: backend/server.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/auth.middleware');

// @route   POST /api/auth/register
// @desc    Register a new user (admin, team_lead, or agent)
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate user and set refresh token cookie
// @access  Public
router.post('/login', authController.login);

// @route   POST /api/auth/refresh
// @desc    Request a new access token using httpOnly refresh cookie
// @access  Public
router.post('/refresh', authController.refresh);

// @route   POST /api/auth/logout
// @desc    Clear cookies and log out
// @access  Public (revokes the refresh cookie session even if access token expired)
router.post('/logout', authController.logout);

// @route   GET /api/auth/me
// @desc    Fetch profile detail for current user
// @access  Protected
router.get('/me', authenticateToken, authController.getMe);

// @route   POST /api/auth/forgot-password
// @desc    Email a time-limited OTP for password reset
// @access  Public
router.post('/forgot-password', authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Verify OTP and set a new password
// @access  Public
router.post('/reset-password', authController.resetPassword);

// @route   POST /api/auth/change-password
// @desc    Change the current user's password after verifying the current one
// @access  Protected
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
