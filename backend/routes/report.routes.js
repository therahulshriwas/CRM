// backend/routes/report.routes.js
// Maps reports endpoints to controller handlers. All protected.
// Used in: backend/server.js.

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticateToken = require('../middleware/auth.middleware');

router.use(authenticateToken);

// @route   GET /api/reports
// @desc    Get extended analytics (heatmap, funnel, source trend, deal velocity)
// @access  Protected
router.get('/', reportController.getReports);

module.exports = router;
