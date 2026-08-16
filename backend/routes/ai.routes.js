// backend/routes/ai.routes.js
// Maps AI endpoints (streaming chat, assistant Q&A, follow-up drafting) to controller
// handlers. All protected. The controller handles provider selection via AIService.
// Used in: backend/server.js.

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authenticateToken = require('../middleware/auth.middleware');
const { aiRateLimiter, aiStreamLimiter } = require('../middleware/aiRateLimit.middleware');

router.use(authenticateToken);
// Per-user request quota + Retry-After header for all AI endpoints.
router.use(aiRateLimiter());

// @route   POST /api/ai/chat
// @desc    Streaming AI copilot conversation (SSE) with automatic CRM context injection
// @access  Protected (also subject to per-user stream limit: max 2 concurrent)
// @rate-limited yes
router.post('/chat', aiStreamLimiter(), aiController.chat);

// @route   POST /api/ai/assistant
// @desc    Ask the AI copilot natural-language questions about leads/deals (JSON)
// @access  Protected
router.post('/assistant', aiController.askAssistant);

// @route   POST /api/ai/draft-follow-up
// @desc    Auto-draft a follow-up message for a lead
// @access  Protected (agents: own leads only)
router.post('/draft-follow-up', aiController.draftFollowUp);

module.exports = router;
