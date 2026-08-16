// backend/routes/upload.routes.js
// Profile image upload endpoints for the signed-in user.
// Used in: backend/server.js.

const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const authenticateToken = require('../middleware/auth.middleware');
const { uploadSingleImage } = require('../middleware/upload.middleware');

// @route   POST /api/uploads/avatar
// @desc    Upload a new profile avatar (admins may pass ?userId= for another user)
// @access  Protected
router.post('/avatar', authenticateToken, uploadSingleImage('avatar'), uploadController.uploadAvatar);

// @route   DELETE /api/uploads/avatar
// @desc    Remove the profile avatar (admins may pass ?userId= for another user)
// @access  Protected
router.delete('/avatar', authenticateToken, uploadController.removeAvatar);

// @route   POST /api/uploads/cover
// @desc    Upload a new cover image for the signed-in user
// @access  Protected
router.post('/cover', authenticateToken, uploadSingleImage('cover'), uploadController.uploadCover);

module.exports = router;
