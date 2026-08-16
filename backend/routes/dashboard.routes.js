// backend/routes/dashboard.routes.js
// Maps endpoint paths to dashboard metrics controller handlers. Secured by authentication token middleware.
// Used in: backend/server.js

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticateToken = require('../middleware/auth.middleware');

// @route   GET /api/dashboard/stats
// @desc    Retrieve role-filtered aggregate dashboard stats and timelines
// @access  Protected
router.get('/stats', authenticateToken, dashboardController.getDashboardStats);

module.exports = router;
