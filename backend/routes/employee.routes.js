// backend/routes/employee.routes.js
// Maps the employees module endpoint to its controller handler. Protected.
// Used in: backend/server.js.

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const authenticateToken = require('../middleware/auth.middleware');

// @route   GET /api/employees
// @desc    List team members with performance stats
// @access  Protected
router.get('/', authenticateToken, employeeController.getEmployees);

module.exports = router;
