// backend/routes/chat.routes.js
// Maps chat endpoints (conversations + messages) to controller handlers. All protected.
// Used in: backend/server.js.

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authenticateToken = require('../middleware/auth.middleware');

router.use(authenticateToken);

// @route   GET /api/chat/conversations
// @desc    List the current user's conversations with participants + last message
// @access  Protected
router.get('/conversations', chatController.getConversations);

// @route   POST /api/chat/conversations
// @desc    Create a direct or group conversation
// @access  Protected
router.post('/conversations', chatController.createConversation);

// @route   GET /api/chat/conversations/:id/messages
// @desc    Paginated message history for a conversation
// @access  Protected (participants only)
router.get('/conversations/:id/messages', chatController.getMessages);

// @route   POST /api/chat/conversations/:id/messages
// @desc    Send a message (REST fallback; also broadcasts via Socket.io)
// @access  Protected (participants only)
router.post('/conversations/:id/messages', chatController.sendMessage);

// @route   POST /api/chat/conversations/:id/read
// @desc    Mark all messages in the conversation as read
// @access  Protected (participants only)
router.post('/conversations/:id/read', chatController.markRead);

module.exports = router;
