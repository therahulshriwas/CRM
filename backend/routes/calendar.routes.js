// backend/routes/calendar.routes.js
// Maps the calendar module endpoint to its controller handler. Protected.
// Used in: backend/server.js.

const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const authenticateToken = require('../middleware/auth.middleware');

// @route   GET /api/calendar/events
// @desc    List calendar events for a month (deals + activities)
// @access  Protected
router.get('/events', authenticateToken, calendarController.getCalendarEvents);

module.exports = router;
