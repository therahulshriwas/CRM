// backend/routes/deal.routes.js
// Maps endpoint paths to deal management controller handlers. Secured by authentication token middleware.
// Used in: backend/server.js

const express = require('express');
const router = express.Router();
const dealController = require('../controllers/deal.controller');
const authenticateToken = require('../middleware/auth.middleware');

// Apply authentication middleware to all deal routes
router.use(authenticateToken);

// @route   GET /api/deals
// @desc    Retrieve deals list (role-restricted view)
// @access  Protected
router.get('/', dealController.getDeals);

// @route   POST /api/deals
// @desc    Create a new deal under a lead (and log activity)
// @access  Protected
router.post('/', dealController.createDeal);

// @route   PUT /api/deals/:id/stage
// @desc    Update a deal's stage (Qualified -> Proposal -> Negotiation -> Won -> Lost)
// @access  Protected
router.put('/:id/stage', dealController.updateDealStage);

module.exports = router;
