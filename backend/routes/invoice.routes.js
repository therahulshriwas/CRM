// backend/routes/invoice.routes.js
// Maps the invoices module endpoints to their controller handlers. Protected.
// Used in: backend/server.js.

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const authenticateToken = require('../middleware/auth.middleware');

// @route   GET /api/invoices
// @desc    List invoices derived from won deals
// @access  Protected
router.get('/', authenticateToken, invoiceController.getInvoices);

module.exports = router;
