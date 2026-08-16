// backend/routes/lead.routes.js
// Maps endpoint paths to lead management controller handlers. Secured by authentication token middleware.
// Used in: backend/server.js

const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const authenticateToken = require('../middleware/auth.middleware');

// Apply authentication middleware to all lead routes
router.use(authenticateToken);

// @route   GET /api/leads
// @desc    Retrieve leads list with search and categorical filters (role-restricted view)
// @access  Protected
router.get('/', leadController.getLeads);

// @route   POST /api/leads
// @desc    Create a new lead (agent defaults to self-owner, admins/leads can select owner)
// @access  Protected
router.post('/', leadController.createLead);

// @route   GET /api/leads/:id
// @desc    Fetch specific lead record by database ID
// @access  Protected
router.get('/:id', leadController.getLeadById);

// @route   PUT /api/leads/:id
// @desc    Update editable fields of a lead
// @access  Protected
router.put('/:id', leadController.updateLead);

// @route   DELETE /api/leads/:id
// @desc    Remove a lead record from the database
// @access  Protected
router.delete('/:id', leadController.deleteLead);

module.exports = router;
