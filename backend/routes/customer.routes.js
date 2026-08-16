// backend/routes/customer.routes.js
// Maps the customers module endpoint to its controller handler. Protected.
// Used in: backend/server.js.

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const authenticateToken = require('../middleware/auth.middleware');

// @route   GET /api/customers
// @desc    List customers with purchase aggregates
// @access  Protected
router.get('/', authenticateToken, customerController.getCustomers);

module.exports = router;
